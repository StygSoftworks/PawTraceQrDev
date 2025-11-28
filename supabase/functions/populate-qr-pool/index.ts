import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get target count from query params or use default 500
    const url = new URL(req.url);
    const targetCount = parseInt(url.searchParams.get("count") || "500");
    const batchSize = parseInt(url.searchParams.get("batchSize") || "100");

    // Check current available QR codes count
    const { data: countData, error: countError } = await supabase
      .rpc("count_unassigned_qr_codes");

    if (countError) {
      throw new Error(`Failed to count QR codes: ${countError.message}`);
    }

    const currentCount = countData || 0;
    const needed = targetCount - currentCount;

    if (needed <= 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: `Pool already has ${currentCount} codes (target: ${targetCount})`,
          current_count: currentCount,
          target_count: targetCount,
          generated: 0,
        }),
        {
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Generate codes in batches
    let totalGenerated = 0;
    const batches = Math.ceil(needed / batchSize);

    for (let i = 0; i < batches; i++) {
      const currentBatchSize = Math.min(batchSize, needed - totalGenerated);
      
      const { data: batchResult, error: batchError } = await supabase
        .rpc("generate_qr_codes_batch", { batch_size: currentBatchSize });

      if (batchError) {
        throw new Error(`Batch ${i + 1} failed: ${batchError.message}`);
      }

      totalGenerated += batchResult || 0;

      // Log progress
      console.log(`Generated batch ${i + 1}/${batches}: ${batchResult} codes`);
    }

    // Get final count
    const { data: finalCountData } = await supabase.rpc("count_unassigned_qr_codes");
    const finalCount = finalCountData || 0;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully generated ${totalGenerated} QR codes`,
        initial_count: currentCount,
        final_count: finalCount,
        generated: totalGenerated,
        target_count: targetCount,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error populating QR pool:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});