import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
import { join } from 'node:path';

const BASE_URL = process.env.PREVIEW_URL || 'http://localhost:4173';
const OUT_DIR = join(process.cwd(), 'docs', 'screenshots');

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

async function screenshot(page, path, url) {
  await page.goto(url, { waitUntil: 'networkidle' });
  // Allow CSS transitions to settle
  await page.waitForTimeout(300);
  await page.screenshot({ path, fullPage: false });
}

async function main() {
  await ensureDir(OUT_DIR);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const targets = [
    { route: '/timer', file: 'timer.png' },
    { route: '/tasks', file: 'tasks.png' },
    { route: '/stats', file: 'stats.png' }
  ];

  for (const t of targets) {
    const url = `${BASE_URL}${t.route}`;
    const out = join(OUT_DIR, t.file);
    await screenshot(page, out, url);
    console.log(`Saved ${out}`);
  }

  await browser.close();
  // Write a simple index for browsing in GH Pages if desired
  const indexPath = join(OUT_DIR, 'index.html');
  const html = `<!doctype html><meta charset="utf-8"/><title>Screenshots</title><body>${targets
    .map(({ file }) => `<div><h3>${file}</h3><img src="./${file}" style="max-width:100%"/></div>`)
    .join('')}</body>`;
  await writeFile(indexPath, html);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
