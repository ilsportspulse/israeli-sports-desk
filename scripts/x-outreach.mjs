// ILSP influencer-outreach via de ingelogde X-browserprofielsessie (~/.ilsp-x-profile).
// Stuurt de door de eigenaar goedgekeurde DM (28 jul) met een persoonlijke openingszin
// per account. Veiligheid: harde daglimiet, ruime pauzes, stopt bij het eerste teken
// van een limiet/lock, en logt elke poging naar ~/.ilsp-x-outreach.json zodat niemand
// ooit twee keer benaderd wordt.
import { chromium } from "playwright";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const STATE = path.join(os.homedir(), ".ilsp-x-outreach.json");
const PROFILE = path.join(os.homedir(), ".ilsp-x-profile");
const MAX_PER_RUN = Number(process.env.X_DM_MAX ?? 10);
const GAP_MS = Number(process.env.X_DM_GAP_MS ?? 75_000);

const message = (personalLine) => `Hi,

We just launched Israel Sports Pulse (ilsportspulse.com) — a brand-new, independent, English-language newsroom covering Israeli sport around the clock: football, basketball, MMA, Israelis abroad. No politics, just the sport.

A word about me: I left Israel for Belgium when I was nine years old — an absolute Israeli sports fan, suddenly cut off, hunting for any scrap of news in the pre-internet era. My dream ever since has been to build exactly what I was searching for back then. I first started this project ten years ago; now I've finally decided to dedicate all my free time to it.

The mission: give Jewish and pro-Israel sports fans around the world one home base in English — the stories that never make it out of the Hebrew press. Like this weekend: Kibedy Gordon knocking out a former UFC fighter in under a minute in Tel Aviv, draped in the Israeli flag.

${personalLine} we'd love for you to have a look. If it resonates, a follow or a share would mean the world to a young Jewish newsroom finding its audience.

Toda raba,
Patrick — Founder, Israel Sports Pulse`;

const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { sent: [], skipped: [] };
const already = new Set(state.sent.map((s) => s.handle.toLowerCase()));
const config = JSON.parse(readFileSync(path.join(root, "config/x-outreach-round1.json"), "utf8"));
const queue = config.targets.filter((t) => !already.has(t.handle.toLowerCase())).slice(0, MAX_PER_RUN);

if (!queue.length) { console.log("Niets te doen — iedereen in deze ronde is al benaderd."); process.exit(0); }

// Verbind met de permanente, ONTGRENDELDE X-sessie (scripts/x-daemon.mjs op
// CDP :9666) — X Chat-passcode is per browserinstantie, dus alle rondes lopen
// via dat ene venster. Zonder daemon: zichtbaar venster + wachten op passcode.
let ctx;
let usingDaemon = false;
try {
  const browser = await chromium.connectOverCDP("http://127.0.0.1:9666");
  ctx = browser.contexts()[0];
  usingDaemon = true;
  console.log("Verbonden met permanente X-sessie.");
} catch {
  ctx = await chromium.launchPersistentContext(PROFILE, { headless: false, viewport: { width: 1280, height: 900 } });
}
const page = await ctx.newPage();
// X heeft DM's naar versleutelde "X Chat" verplaatst: de composer opent, maar een
// bericht wordt PAS verzonden nadat de Chat met de passcode is ontgrendeld (X moet
// de encryptiesleutels ontsleutelen). Daarom eerst /i/chat openen om de passcode-
// prompt te triggeren en op de eigenaar wachten; zonder ontgrendeling mislukt elke
// verzending stil ("bericht niet zichtbaar na verzenden").
await page.goto("https://x.com/i/chat", { waitUntil: "domcontentloaded", timeout: 45_000 });
await page.waitForTimeout(5000);
if ((await page.evaluate(() => document.body.innerText)).includes("Enter Passcode")) {
  console.log("→ Tik je X Chat-passcode in het venster in; ik wacht (max 15 min) en ga daarna zelf verder…");
  const deadline = Date.now() + 15 * 60_000;
  while (Date.now() < deadline) {
    await page.waitForTimeout(4000);
    const t = await page.evaluate(() => document.body.innerText).catch(() => "");
    if (!t.includes("Enter Passcode")) break;
  }
  const still = await page.evaluate(() => document.body.innerText).catch(() => "");
  if (still.includes("Enter Passcode")) { console.log("Passcode niet ingevoerd — ronde afgebroken."); await ctx.close(); process.exit(1); }
  console.log("✓ Chat ontgrendeld — ronde start.");
}
const save = () => writeFileSync(STATE, JSON.stringify(state, null, 2));
let sentThisRun = 0;

for (const target of queue) {
  const label = `@${target.handle}`;
  try {
    await page.goto(`https://x.com/${target.handle}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
    await page.waitForTimeout(3500);
    if (await page.locator('[data-testid="emptyState"]').count()) {
      console.log(`✗ ${label}: profiel bestaat niet — overgeslagen`);
      state.skipped.push({ handle: target.handle, reason: "no-profile", at: new Date().toISOString() });
      save(); continue;
    }
    const dmButton = page.locator('[data-testid="sendDMFromProfile"]');
    if (!(await dmButton.count())) {
      console.log(`✗ ${label}: DM's gesloten — overgeslagen (later publiek/mail)`);
      state.skipped.push({ handle: target.handle, reason: "dms-closed", at: new Date().toISOString() });
      save(); continue;
    }
    await dmButton.first().click();
    // Nieuwe X Chat-UI (2026): conversatiescherm met dm-composer-textarea.
    const editor = page.locator('[data-testid="dm-composer-textarea"]').first();
    await editor.waitFor({ timeout: 20_000 });
    await editor.click();
    await editor.fill(message(target.personalLine));
    await page.waitForTimeout(1200);
    // Versturen: eerst de composer-send-knop; anders een page-level Enter.
    // locator.press("Enter") kan 30s blokkeren als de editor-node na fill opnieuw
    // gerenderd is — daarom page.keyboard i.p.v. de (mogelijk stale) locator.
    const sendBtn = page.locator('[data-testid="dm-composer-send-button"], [data-testid="dm-composer-form"] button[type="submit"], button[aria-label="Send"], div[aria-label="Send"][role="button"]').first();
    if (await sendBtn.count().catch(() => 0)) {
      await sendBtn.click({ timeout: 10_000 }).catch(async () => { await page.keyboard.press("Enter"); });
    } else {
      await editor.click({ timeout: 8_000 }).catch(() => {});
      await page.keyboard.press("Enter");
    }
    // Verifieer dat het bericht echt in de conversatie staat vóór we het als
    // verzonden loggen.
    await page.waitForTimeout(3000);
    const delivered = await page.locator('[data-testid="dm-message-list"]').innerText().catch(() => "");
    if (!delivered.includes("Israel Sports Pulse")) throw new Error("bericht niet zichtbaar in conversatie na verzenden");
    console.log(`✓ ${label}: DM verzonden`);
    state.sent.push({ handle: target.handle, name: target.name, at: new Date().toISOString() });
    sentThisRun += 1;
    save();
    await page.waitForTimeout(GAP_MS);
  } catch (error) {
    console.log(`✗ ${label}: ${error.message.split("\n")[0]}`);
    state.skipped.push({ handle: target.handle, reason: error.message.split("\n")[0], at: new Date().toISOString() });
    save();
    // Bij een mogelijke rate-limit/lock direct stoppen — accountveiligheid boven volume.
    if (/limit|locked|restricted|suspended/i.test(error.message)) { console.log("STOP: mogelijke limiet — ronde afgebroken."); break; }
  }
}

if (usingDaemon) { await page.close(); } else { await ctx.close(); }
console.log(`Klaar: ${sentThisRun} verzonden, ${state.sent.length} totaal, ${state.skipped.length} overgeslagen.`);
