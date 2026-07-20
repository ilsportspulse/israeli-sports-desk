import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "playwright";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDirectory = path.join(root, "outputs/site-mobile-qa");
const baseUrl = process.env.ILSP_SITE_QA_URL ?? "http://127.0.0.1:3000";
const scenarios = [
  { id: "home-390", path: "/", width: 390, height: 844 },
  { id: "home-360", path: "/", width: 360, height: 800 },
  { id: "super-cup-recap-390", path: "/article/kanaan-absence-gives-super-cup-preparation-an-early-edge", width: 390, height: 844 },
  { id: "blorian-mls-recap-390", path: "/article/or-blorian-mls-debut-st-louis-sporting-kc-3-2", width: 390, height: 844 },
  { id: "basketball-recap-390", path: "/article/israel-u20-italy-84-59-division-a-safety", width: 390, height: 844 },
  { id: "club-basketball-recap-390", path: "/article/saraf-wolf-brooklyn-houston-summer-league-loss", width: 390, height: 844 },
  { id: "world-cup-smoke-390", path: "/article/wildfire-smoke-spain-training-world-cup-final", width: 390, height: 844 },
  { id: "world-cup-referee-390", path: "/article/slavko-vincic-world-cup-final-referee", width: 390, height: 844 },
  { id: "giannis-miami-introduction-390", path: "/article/giannis-antetokounmpo-miami-heat-introduction-title-path", width: 390, height: 844 },
  { id: "gary-trent-probe-390", path: "/article/gary-trent-bucks-contract-nba-probe", width: 390, height: 844 },
  { id: "kanichowsky-390", path: "/article/gabi-kanichowsky-ferencvaros-vojvodina-twente-europa-league", width: 390, height: 844 },
  { id: "long-beach-sailing-390", path: "/article/steinberg-kantor-long-beach-iqfoil-sixth-eighth", width: 390, height: 844 },
  { id: "world-cup-rings-390", path: "/article/fifa-world-cup-2026-champions-rings", width: 390, height: 844 },
  { id: "motley-red-star-390", path: "/article/red-star-talks-hapoel-tel-aviv-johnathan-motley", width: 390, height: 844 },
  { id: "argentina-malvinas-390", path: "/article/argentina-malvinas-banner-england-world-cup-semifinal", width: 390, height: 844 },
  { id: "maccabi-haifa-womens-academy-390", path: "/article/maccabi-haifa-womens-basketball-academy-reali-school", width: 390, height: 844 },
  { id: "corrections-390", path: "/corrections", width: 390, height: 844 },
  { id: "privacy-390", path: "/privacy", width: 390, height: 844 },
  { id: "terms-390", path: "/terms", width: 390, height: 844 },
  { id: "commercial-independence-390", path: "/commercial-independence", width: 390, height: 844 },
  { id: "about-390", path: "/about", width: 390, height: 844 },
  { id: "home-1440", path: "/", width: 1440, height: 1000 },
  { id: "super-cup-recap-1440", path: "/article/kanaan-absence-gives-super-cup-preparation-an-early-edge", width: 1440, height: 1000 },
  { id: "blorian-mls-recap-1440", path: "/article/or-blorian-mls-debut-st-louis-sporting-kc-3-2", width: 1440, height: 1000 },
  { id: "basketball-recap-1440", path: "/article/israel-u20-italy-84-59-division-a-safety", width: 1440, height: 1000 },
  { id: "club-basketball-recap-1440", path: "/article/saraf-wolf-brooklyn-houston-summer-league-loss", width: 1440, height: 1000 },
  { id: "world-cup-smoke-1440", path: "/article/wildfire-smoke-spain-training-world-cup-final", width: 1440, height: 1000 },
  { id: "world-cup-referee-1440", path: "/article/slavko-vincic-world-cup-final-referee", width: 1440, height: 1000 },
  { id: "giannis-miami-introduction-1440", path: "/article/giannis-antetokounmpo-miami-heat-introduction-title-path", width: 1440, height: 1000 },
  { id: "gary-trent-probe-1440", path: "/article/gary-trent-bucks-contract-nba-probe", width: 1440, height: 1000 },
  { id: "kanichowsky-1440", path: "/article/gabi-kanichowsky-ferencvaros-vojvodina-twente-europa-league", width: 1440, height: 1000 },
  { id: "long-beach-sailing-1440", path: "/article/steinberg-kantor-long-beach-iqfoil-sixth-eighth", width: 1440, height: 1000 },
  { id: "world-cup-rings-1440", path: "/article/fifa-world-cup-2026-champions-rings", width: 1440, height: 1000 },
  { id: "motley-red-star-1440", path: "/article/red-star-talks-hapoel-tel-aviv-johnathan-motley", width: 1440, height: 1000 },
  { id: "argentina-malvinas-1440", path: "/article/argentina-malvinas-banner-england-world-cup-semifinal", width: 1440, height: 1000 },
  { id: "maccabi-haifa-womens-academy-1440", path: "/article/maccabi-haifa-womens-basketball-academy-reali-school", width: 1440, height: 1000 },
  { id: "corrections-1440", path: "/corrections", width: 1440, height: 1000 },
  { id: "privacy-1440", path: "/privacy", width: 1440, height: 1000 },
  { id: "terms-1440", path: "/terms", width: 1440, height: 1000 },
  { id: "commercial-independence-1440", path: "/commercial-independence", width: 1440, height: 1000 },
  { id: "about-1440", path: "/about", width: 1440, height: 1000 },
];

await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];

try {
  for (const scenario of scenarios) {
    const context = await browser.newContext({
      viewport: { width: scenario.width, height: scenario.height },
      deviceScaleFactor: 2,
      isMobile: scenario.width < 700,
      hasTouch: scenario.width < 700,
    });
    const page = await context.newPage();
    const localResourceFailures = [];
    page.on("response", (resourceResponse) => {
      if (resourceResponse.status() >= 400 && resourceResponse.url().startsWith(baseUrl)) {
        localResourceFailures.push({ statusCode: resourceResponse.status(), url: resourceResponse.url() });
      }
    });
    const response = await page.goto(`${baseUrl}${scenario.path}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(400);
    const measurements = await page.evaluate(() => {
      const viewportWidth = window.innerWidth;
      const overflow = [...document.querySelectorAll("body *")]
        .map((element) => {
          const rect = element.getBoundingClientRect();
          const style = getComputedStyle(element);
          return {
            selector: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ""}${[...element.classList].slice(0, 3).map((name) => `.${name}`).join("")}`,
            left: Math.round(rect.left),
            right: Math.round(rect.right),
            width: Math.round(rect.width),
            overflowX: style.overflowX,
            position: style.position,
          };
        })
        .filter((item) => item.width > 0 && (item.left < -1 || item.right > viewportWidth + 1))
        .slice(0, 25);
      return {
        viewportWidth,
        documentWidth: document.documentElement.scrollWidth,
        bodyWidth: document.body.scrollWidth,
        noHorizontalOverflow: document.documentElement.scrollWidth <= viewportWidth + 1,
        stylesheetRuleCount: [...document.styleSheets].reduce((total, stylesheet) => {
          try {
            return total + stylesheet.cssRules.length;
          } catch {
            return total;
          }
        }, 0),
        overflow,
      };
    });
    const screenshot = `${scenario.id}.png`;
    await page.screenshot({ path: path.join(outputDirectory, screenshot), fullPage: false });
    results.push({ ...scenario, statusCode: response?.status() ?? null, screenshot, localResourceFailures, ...measurements });
    await context.close();
  }
} finally {
  await browser.close();
}

const failures = results.filter((result) => (
  result.statusCode !== 200
  || !result.noHorizontalOverflow
  || result.localResourceFailures.length > 0
  || result.stylesheetRuleCount === 0
));
const report = {
  checkedAt: new Date().toISOString(),
  baseUrl,
  summary: {
    scenarios: results.length,
    passed: results.length - failures.length,
    failed: failures.length,
    statusFailures: failures.filter((result) => result.statusCode !== 200).length,
    overflowFailures: failures.filter((result) => !result.noHorizontalOverflow).length,
    resourceFailures: failures.filter((result) => result.localResourceFailures.length > 0).length,
    stylesheetFailures: failures.filter((result) => result.stylesheetRuleCount === 0).length,
  },
  results,
};
await writeFile(path.join(outputDirectory, "report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exitCode = 1;
