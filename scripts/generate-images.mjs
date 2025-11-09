import { promises as fs } from "fs";
import path from "node:path";
import { glob } from "glob";
import sharp from "sharp";

const SIZES = [480, 768, 1024, 1440, 1920];
const FORMATS = {
  avif: { quality: 50 },
  webp: { quality: 75 },
  jpg:  { quality: 82, progressive: true }
};

const outDir = "public/images/hero";
await fs.mkdir(outDir, { recursive: true });

// Create format subdirectories
for (const fmt of Object.keys(FORMATS)) {
  await fs.mkdir(path.join(outDir, fmt), { recursive: true });
}

const patterns = process.argv.slice(2);
const files = (await Promise.all(patterns.map(p => glob(p)))).flat();

for (const src of files) {
  const base = path.parse(src).name;
  const manifest = { base, outDir, sizes: SIZES, formats: Object.keys(FORMATS), srcsets: {} };

  for (const w of SIZES) {
    const h = Math.round(w * 9 / 16); // 16:9 hero crop
    const basePipe = sharp(src).rotate().resize({ width: w, height: h, fit: "cover", position: "attention" });

    for (const fmt of Object.keys(FORMATS)) {
      const out = path.join(outDir, fmt, `${base}-${w}.${fmt}`);
      await basePipe.clone().toFormat(fmt, FORMATS[fmt]).toFile(out);
      manifest.srcsets[fmt] ||= [];
      manifest.srcsets[fmt].push(`${fmt}/${base}-${w}.${fmt} ${w}w`);
    }
  }

  // tiny blur placeholder (LQIP)
  const lqip = await sharp(src)
    .resize({ width: 24, height: Math.round(24 * 9/16), fit: "cover", position: "attention" })
    .toFormat("webp", { quality: 30 })
    .toBuffer();
  manifest.lqip = `data:image/webp;base64,${lqip.toString("base64")}`;

  await fs.writeFile(path.join(outDir, `${base}.manifest.json`), JSON.stringify(manifest, null, 2));
  console.log(`✓ Generated variants for ${src}`);
}