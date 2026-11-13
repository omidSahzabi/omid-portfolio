// Rebuild lossless delivery assets from the untouched source PNGs.
// sharp is already supplied by Next.js; no additional package is required.
import sharp from "sharp";
import { mkdir } from "node:fs/promises";

const directory = "public/images/optimized";
await mkdir(directory, { recursive: true });
for (const name of ["logo", "dreamservice.net", "hosseinseyedzade.dreamservice.net", "httpshosseinseyedzade.dreamservice.net", "mezonshikpik"]) {
  // Preserve every source pixel, including full-resolution project screenshots.
  const result = await sharp(`public/images/${name}.png`).webp({ lossless: true, effort: 6 }).toFile(`${directory}/${name}.webp`);
  console.log(`${name}: ${result.size} bytes`);
}
for (const size of [48, 180]) {
  await sharp("public/images/favicon.png").resize(size, size).png({ compressionLevel: 9 }).toFile(`${directory}/icon-${size}.png`);
}
for (const width of [216, 432, 648, 864]) {
  await sharp("public/images/logo.png").resize({ width }).webp({ lossless: true, effort: 6 }).toFile(`${directory}/logo-${width}.webp`);
}
