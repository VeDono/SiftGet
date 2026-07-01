// Rasterize src/assets/icon.svg into the PNG sizes Chrome needs.
// Chrome extension action/manifest icons must be PNG (SVG isn't supported),
// so we render them from the single source SVG with sharp.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import sharp from 'sharp'

const here = dirname(fileURLToPath(import.meta.url))
const root = resolve(here, '..')
const svgPath = resolve(root, 'src/shared/assets/icon.svg')
const outDir = resolve(root, 'src/shared/assets/icons')

const SIZES = [16, 32, 48, 128]

async function main() {
  const svg = await readFile(svgPath)
  await mkdir(outDir, { recursive: true })

  await Promise.all(
    SIZES.map(async (size) => {
      const png = await sharp(svg, { density: 384 })
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
      const out = resolve(outDir, `icon-${size}.png`)
      await writeFile(out, png)
      console.log(`  ✓ icon-${size}.png (${png.length} bytes)`)
    }),
  )
  console.log('Icons generated.')
}

main().catch((err) => {
  console.error('Icon generation failed:', err)
  process.exit(1)
})
