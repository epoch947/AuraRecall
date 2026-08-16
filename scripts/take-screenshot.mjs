import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import puppeteer from 'puppeteer'

async function main() {
  const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
  const outDir = path.join(scriptDirectory, '..', '.debug_screenshots')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()

  // iPhone 14 logical resolution at 2x -> 780x1688 output image.
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

  console.log('Navigating to debug page…')
  await page.goto('http://localhost:3000/debug', {
    waitUntil: 'networkidle2',
    timeout: 15_000,
  })

  // Allow the Framer Motion enter animation to settle.
  await new Promise((resolve) => setTimeout(resolve, 2_200))

  const outPath = path.join(outDir, 'current_ui.png')
  await page.screenshot({ path: outPath, fullPage: false })

  console.log(`✓ Screenshot saved → ${outPath}`)
  await browser.close()
}

main().catch((error) => {
  console.error('Screenshot failed:', error.message)
  process.exit(1)
})
