import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "outputs/mobile-qa");
const baseUrl = process.env.MOBILE_QA_URL ?? "http://127.0.0.1:19007";

const scenarios = [
  {
    id: "landscape",
    width: 844,
    height: 390,
    fontScale: 1,
    screenshot: "feed-en-landscape-844x390@2x.png",
  },
  {
    id: "large-text",
    width: 390,
    height: 844,
    fontScale: 2,
    screenshot: "feed-en-large-text-390x844@2x.png",
  },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  args: ["--disable-web-security"],
});
const results = [];

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: "networkidle" });
    await page.getByText("Latest", { exact: true }).waitFor({ timeout: 20_000 });

    if (scenario.fontScale > 1) {
      await page.evaluate((fontScale) => {
        for (const element of document.querySelectorAll("div,span")) {
          const computed = getComputedStyle(element);
          const fontSize = Number.parseFloat(computed.fontSize);
          const lineHeight = Number.parseFloat(computed.lineHeight);
          if (fontSize > 0) element.style.fontSize = `${fontSize * fontScale}px`;
          if (Number.isFinite(lineHeight) && lineHeight > 0) {
            element.style.lineHeight = `${lineHeight * fontScale}px`;
          }
        }
      }, scenario.fontScale);
      await page.waitForTimeout(500);
    }

    const measurements = await page.evaluate(() => {
      const languageButton = [...document.querySelectorAll("[role=button]")]
        .find((element) => element.textContent?.trim().startsWith("עברית"));
      const buttonBox = languageButton?.getBoundingClientRect();
      const brand = [...document.querySelectorAll("*")]
        .find((element) => (
          element.children.length === 0
          && element.textContent?.trim() === "Israel Sports Pulse"
        ));
      const brandBox = brand?.getBoundingClientRect();
      const brandLineHeight = brand ? Number.parseFloat(getComputedStyle(brand).lineHeight) : 0;

      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
        languageButtonVisible: Boolean(
          buttonBox
          && buttonBox.left >= 0
          && buttonBox.right <= window.innerWidth
          && buttonBox.top >= 0
          && buttonBox.bottom <= window.innerHeight,
        ),
        brandFullyVisible: Boolean(
          brandBox
          && brandBox.left >= 0
          && brandBox.right <= window.innerWidth
          && brandBox.top >= 0
          && brandBox.bottom <= window.innerHeight,
        ),
        brandEstimatedLines: brandBox && brandLineHeight
          ? Math.max(1, Math.round(brandBox.height / brandLineHeight))
          : null,
      };
    });

    if (!measurements.noHorizontalOverflow) {
      throw new Error(`${scenario.id}: horizontal overflow (${measurements.documentWidth}px)`);
    }
    if (!measurements.languageButtonVisible) {
      throw new Error(`${scenario.id}: language control is outside the viewport`);
    }
    if (!measurements.brandFullyVisible) {
      throw new Error(`${scenario.id}: brand lockup is clipped`);
    }

    await page.screenshot({
      path: path.join(outputDirectory, scenario.screenshot),
      fullPage: false,
    });
    results.push({ ...scenario, ...measurements, status: "pass" });
    await context.close();
  }
} finally {
  await browser.close();
}

const report = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  scope: "responsive web proxy for native rotation and text scaling; native simulator acceptance remains separate",
  results,
};
await writeFile(
  path.join(outputDirectory, "responsive-qa-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
