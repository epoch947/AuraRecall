const puppeteer = require('puppeteer')
const path = require('path')
const fs = require('fs')

async function main() {
  const outDir = path.join(__dirname, '..', '.debug_screenshots')
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  const page = await browser.newPage()

  // iPhone 14 logical resolution at 2x → 780×1688 output image
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 })

  console.log('Navigating to debug page…')
  await page.goto('http://localhost:3000/debug', {
    waitUntil: 'networkidle2',
    timeout: 15000,
  })

  // Allow Framer Motion enter animations to settle (phaseVariants = 0.6s) + buffer
  await new Promise((r) => setTimeout(r, 2200))

  const outPath = path.join(outDir, 'current_ui.png')
  await page.screenshot({ path: outPath, fullPage: false })

  console.log(`✓ Screenshot saved → ${outPath}`)
  await browser.close()
}

main().catch((err) => {
  console.error('Screenshot failed:', err.message)
  process.exit(1)
})
