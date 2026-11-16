import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

const BASE_URL = process.env.PLAYGROUND_URL ?? "http://localhost:3000";
const OUT_DIR = path.join(process.cwd(), "public", "landing");
const RAW_WEBM = path.join(OUT_DIR, "hero-demo-raw.webm");
const VIDEO_PATH = path.join(OUT_DIR, "hero-demo.webm");
const POSTER_PATH = path.join(OUT_DIR, "hero-demo-poster.jpg");

const OUTPUT_WIDTH = 1054;
const OUTPUT_HEIGHT = 749;
const CAPTURE_WIDTH = 1440;
const CAPTURE_HEIGHT = 900;

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const p of [RAW_WEBM, VIDEO_PATH, POSTER_PATH]) {
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: CAPTURE_WIDTH, height: CAPTURE_HEIGHT },
  deviceScaleFactor: 1,
  recordVideo: {
    dir: OUT_DIR,
    size: { width: OUTPUT_WIDTH, height: OUTPUT_HEIGHT },
  },
});

await context.addInitScript(() => {
  localStorage.setItem("api-playground-entered", "1");
  localStorage.removeItem("api-playground-explorer-explain-shown");
  localStorage.removeItem("api-playground-explorer-explain-dismissed");
});

const page = await context.newPage();
await page.goto(`${BASE_URL}/play`, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.getByRole("button", { name: "Test a GET", exact: true }).click();
await page.waitForFunction(
  () => {
    const text = document.body.innerText;
    return /\b200\b/.test(text) && text.includes("id");
  },
  { timeout: 45_000 },
);
await page.waitForTimeout(600);

const analyze = page.getByRole("button", { name: "Analyze now" }).first();
await analyze.waitFor({ state: "visible", timeout: 15_000 });
await analyze.click();
await page.waitForTimeout(5000);

await context.close();
await browser.close();

const recorded = fs
  .readdirSync(OUT_DIR)
  .filter((f) => f.endsWith(".webm"))
  .map((f) => ({ f, t: fs.statSync(path.join(OUT_DIR, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t)[0]?.f;

if (!recorded) {
  console.error("No recording produced.");
  process.exit(1);
}

fs.renameSync(path.join(OUT_DIR, recorded), RAW_WEBM);

execFileSync(
  ffmpegInstaller.path,
  [
    "-y",
    "-i",
    RAW_WEBM,
    "-c:v",
    "libvpx-vp9",
    "-crf",
    "30",
    "-b:v",
    "0",
    "-an",
    "-row-mt",
    "1",
    VIDEO_PATH,
  ],
  { stdio: "inherit" },
);

execFileSync(
  ffmpegInstaller.path,
  [
    "-y",
    "-i",
    VIDEO_PATH,
    "-vframes",
    "1",
    "-q:v",
    "2",
    POSTER_PATH,
  ],
  { stdio: "inherit" },
);

fs.unlinkSync(RAW_WEBM);

const sizeKb = Math.round(fs.statSync(VIDEO_PATH).size / 1024);
console.log(`Wrote ${VIDEO_PATH} (${sizeKb} KB)`);
console.log(`Wrote ${POSTER_PATH}`);