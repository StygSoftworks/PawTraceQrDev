#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import QRCode from 'qrcode';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';

function generateShortId(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return result;
}

async function makeQrDataUrl(text: string): Promise<string> {
  return await QRCode.toDataURL(text, {
    errorCorrectionLevel: 'M',
    margin: 1,
    scale: 8,
    color: { dark: '#000000', light: '#ffffff' },
  });
}

async function dataUrlToBlob(dataUrl: string): Promise<Buffer> {
  const base64Data = dataUrl.split(',')[1];
  return Buffer.from(base64Data, 'base64');
}

async function uploadQrToStorage(shortId: string, blob: Buffer): Promise<string> {
  const path = `qr-pool/${shortId}.png`;

  const { error } = await supabase.storage
    .from('pet-qr')
    .upload(path, blob, { contentType: 'image/png', upsert: true });

  if (error) {
    throw new Error(`Failed to upload QR code for ${shortId}: ${error.message}`);
  }

  const { data } = supabase.storage.from('pet-qr').getPublicUrl(path);
  return data.publicUrl;
}

async function generateAndStoreQrCode(shortId: string): Promise<string> {
  const qrTarget = `https://www.pawtraceqr.com/p/${shortId}`;
  const dataUrl = await makeQrDataUrl(qrTarget);
  const blob = await dataUrlToBlob(dataUrl);
  return await uploadQrToStorage(shortId, blob);
}

async function checkExistingShortId(shortId: string): Promise<boolean> {
  const { data } = await supabase
    .from('qr_codes')
    .select('short_id')
    .eq('short_id', shortId)
    .maybeSingle();

  return data !== null;
}

async function preloadQrCodes(count: number): Promise<void> {
  console.log(`Starting QR code preloading: ${count} codes requested\n`);

  let currentLength = 1;
  let generatedCount = 0;
  let attemptsAtCurrentLength = 0;
  const maxAttemptsPerLength = 1000;
  const batchSize = 10;

  while (generatedCount < count) {
    const batch: Array<{ short_id: string; qr_url: string }> = [];

    for (let i = 0; i < batchSize && generatedCount + batch.length < count; i++) {
      let shortId: string;
      let attempts = 0;

      do {
        shortId = generateShortId(currentLength);
        attempts++;

        if (attempts > 100) {
          console.log(`Too many collision attempts at length ${currentLength}, moving to length ${currentLength + 1}`);
          currentLength++;
          attemptsAtCurrentLength = 0;
          attempts = 0;
          continue;
        }
      } while (await checkExistingShortId(shortId));

      attemptsAtCurrentLength++;

      if (attemptsAtCurrentLength > maxAttemptsPerLength) {
        console.log(`Generated ${attemptsAtCurrentLength} codes at length ${currentLength}, moving to length ${currentLength + 1}`);
        currentLength++;
        attemptsAtCurrentLength = 0;
      }

      try {
        console.log(`Generating QR code ${generatedCount + batch.length + 1}/${count}: ${shortId}`);
        const qrUrl = await generateAndStoreQrCode(shortId);
        batch.push({ short_id: shortId, qr_url: qrUrl });
      } catch (error) {
        console.error(`Failed to generate QR for ${shortId}:`, error);
        i--;
      }
    }

    if (batch.length > 0) {
      const { error } = await supabase
        .from('qr_codes')
        .insert(batch);

      if (error) {
        console.error('Failed to insert batch:', error);
      } else {
        generatedCount += batch.length;
        console.log(`✓ Inserted batch of ${batch.length} codes (Total: ${generatedCount}/${count})\n`);
      }
    }
  }

  await supabase
    .from('qr_generation_state')
    .update({
      current_length: currentLength,
      codes_generated_at_length: attemptsAtCurrentLength,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1);

  console.log(`\n✅ Successfully preloaded ${generatedCount} QR codes`);
  console.log(`   Final generation length: ${currentLength}`);
  console.log(`   Codes generated at final length: ${attemptsAtCurrentLength}`);
}

async function getUnassignedCount(): Promise<number> {
  const { data, error } = await supabase.rpc('count_unassigned_qr_codes');

  if (error) {
    console.error('Error counting unassigned codes:', error);
    return 0;
  }

  return data || 0;
}

async function main() {
  const args = process.argv.slice(2);
  const requestedCount = args[0] ? parseInt(args[0]) : 500;

  if (isNaN(requestedCount) || requestedCount <= 0) {
    console.error('Please provide a valid positive number of QR codes to generate');
    process.exit(1);
  }

  const unassignedCount = await getUnassignedCount();
  console.log(`Current unassigned QR codes: ${unassignedCount}`);

  if (unassignedCount < 100) {
    console.log(`⚠️  Warning: Unassigned count below threshold (100)`);
    console.log(`Proceeding with generation of ${requestedCount} new codes...\n`);
  } else {
    console.log(`Pool is healthy. Generating ${requestedCount} codes...\n`);
  }

  await preloadQrCodes(requestedCount);

  const newUnassignedCount = await getUnassignedCount();
  console.log(`\nFinal unassigned QR codes: ${newUnassignedCount}`);
}

main().catch(console.error);
