import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  Presentation,
  PresentationFile,
} from "/Users/patrickvandenbroek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

process.on("uncaughtException", (error) => {
  console.error(`DECK_ERROR: ${error?.message || String(error)}`);
  process.exit(1);
});
process.on("unhandledRejection", (error) => {
  console.error(`DECK_ERROR: ${error?.message || String(error)}`);
  process.exit(1);
});

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assetDir = path.join(root, "outputs", "deck-assets");
const outputDir = path.join(root, "outputs");
const previewDir = path.join(outputDir, "deck-preview");
const deckPath = path.join(outputDir, "ilsp-founding-partner-deck.pptx");
await fs.mkdir(previewDir, { recursive: true });

const W = 1280;
const H = 720;
const C = {
  navy: "#071426",
  navy2: "#112642",
  blue: "#155EEF",
  blue2: "#407CFF",
  live: "#4F7DFF",
  cream: "#F4F4EF",
  white: "#FFFFFF",
  ink: "#111722",
  slate: "#69707D",
  pale: "#EEF4FF",
  line: "#D9E0EA",
  green: "#22A06B",
  amber: "#E59A18",
};

const presentation = Presentation.create({ slideSize: { width: W, height: H } });

async function imageBlob(file) {
  const bytes = await fs.readFile(path.join(assetDir, file));
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function box(slide, x, y, w, h, fill, radius = "rounded-xl", lineFill = "none", lineWidth = 0) {
  return slide.shapes.add({
    geometry: radius === "none" ? "rect" : "roundRect",
    position: { left: x, top: y, width: w, height: h },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
    ...(radius === "none" ? {} : { borderRadius: radius }),
  });
}

function text(slide, value, x, y, w, h, options = {}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    position: { left: x, top: y, width: w, height: h },
    fill: options.fill || "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = value;
  shape.text.style = {
    fontFamily: options.fontFamily || "Aptos",
    fontSize: options.fontSize || 24,
    bold: options.bold || false,
    color: options.color || C.ink,
    alignment: options.align || "left",
    verticalAlignment: options.valign || "middle",
    ...(options.italic ? { italic: true } : {}),
  };
  return shape;
}

function pill(slide, label, x, y, w, fill = C.live, color = C.navy) {
  box(slide, x, y, w, 30, fill, "rounded-full");
  text(slide, label, x, y, w, 30, { fontSize: 12, bold: true, color, align: "center" });
}

function slideHeader(slide, eyebrow, title, subtitle, dark = false) {
  const ink = dark ? C.white : C.navy;
  text(slide, eyebrow.toUpperCase(), 72, 40, 620, 24, { fontSize: 12, bold: true, color: dark ? C.live : C.blue });
  text(slide, title, 72, 68, 1120, 76, { fontSize: 42, bold: true, color: ink });
  if (subtitle) text(slide, subtitle, 72, 142, 1090, 50, { fontSize: 18, color: dark ? "#C7D3E4" : C.slate });
}

function footer(slide, page, source = "ILSP partner brief · 17 July 2026") {
  text(slide, source, 72, 684, 960, 18, { fontSize: 9, color: "#8492A6" });
  text(slide, String(page).padStart(2, "0"), 1160, 680, 48, 20, { fontSize: 10, bold: true, color: C.blue, align: "right" });
}

async function addImage(slide, file, x, y, w, h, fit = "cover", radius = "rounded-xl", alt = "ILSP product screenshot") {
  return slide.images.add({
    blob: await imageBlob(file),
    contentType: "image/png",
    alt,
    fit,
    position: { left: x, top: y, width: w, height: h },
    geometry: radius === "none" ? "rect" : "roundRect",
    ...(radius === "none" ? {} : { borderRadius: radius }),
  });
}

async function addLocalImage(slide, filePath, contentType, x, y, w, h, fit = "contain", geometry = "rect", alt = "ILSP visual") {
  const bytes = await fs.readFile(filePath);
  return slide.images.add({
    blob: bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    contentType,
    alt,
    fit,
    position: { left: x, top: y, width: w, height: h },
    geometry,
  });
}

// 01 — Cover ------------------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  await addImage(slide, "homepage-desktop.png", 560, 0, 720, 720, "cover", "none", "Israel Sports Pulse live product");
  box(slide, 0, 0, 690, 720, C.navy, "none");
  await addLocalImage(slide, path.join(root, "public/brand/ilsp-lockup-white.svg"), "image/svg+xml", 72, 48, 500, 100, "contain", "rect", "Current Israel Sports Pulse lockup");
  pill(slide, "FOUNDING PARTNER BRIEF", 72, 174, 218, C.live, C.navy);
  text(slide, "THE DAILY HOME\nFOR ISRAELI SPORT", 72, 220, 540, 148, { fontSize: 50, bold: true, color: C.white });
  text(slide, "English reporting. Scores. History. Community.", 72, 382, 520, 44, { fontSize: 23, bold: true, color: C.live });
  text(slide, "A professional English-language newsroom and daily sports habit—built in Israel for supporters everywhere.", 72, 444, 492, 90, { fontSize: 20, color: "#D2DCEB" });
  text(slide, "12-MONTH LAUNCH · JULY 2026", 72, 632, 420, 24, { fontSize: 11, bold: true, color: "#8EA2BF" });
}

// 02 — Opportunity ------------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.cream;
  slideHeader(slide, "The opportunity", "Israeli sport is global. Its English daily layer is not.", "The gap is not another translation feed. It is a trusted product that connects reporting, scores, history and community.");
  const cards = [
    ["01", "Daily relevance", "Football, basketball and Olympic sport move throughout the day—not once per news cycle."],
    ["02", "Diaspora access", "Supporters outside Israel need accurate names, context and terminology in natural English."],
    ["03", "Utility + journalism", "Scores, tables and line-ups create habit; verified reporting creates trust."],
    ["04", "Partner-safe context", "A governed sports environment with measurable inventory and no editorial pay-to-play."],
  ];
  cards.forEach((card, i) => {
    const x = 72 + i * 292;
    box(slide, x, 236, 268, 300, i === 0 ? C.navy : C.white, "rounded-2xl", i === 0 ? "none" : C.line, 1);
    text(slide, card[0], x + 24, 258, 58, 28, { fontSize: 14, bold: true, color: i === 0 ? C.live : C.blue });
    text(slide, card[1], x + 24, 307, 220, 66, { fontSize: 25, bold: true, color: i === 0 ? C.white : C.navy });
    text(slide, card[2], x + 24, 390, 220, 116, { fontSize: 16, color: i === 0 ? "#C7D3E4" : C.slate });
  });
  box(slide, 72, 570, 1136, 74, C.live, "rounded-xl");
  text(slide, "ILSP proposition", 96, 588, 176, 34, { fontSize: 14, bold: true, color: C.navy });
  text(slide, "Fast enough for the match. Serious enough for the story.", 280, 585, 880, 36, { fontSize: 24, bold: true, color: C.navy });
  footer(slide, 2);
}

// 03 — Founder story ---------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.cream;
  slideHeader(slide, "The founder story", "Distance from Israel turned a gap into a mission.", "Patrick Vanden Broek is building the English sports home he searched for as an Israeli growing up in Belgium.");
  box(slide, 1068, 36, 152, 152, C.blue, "rounded-full");
  await addLocalImage(
    slide,
    path.join(assetDir, "founder-patrick-vanden-broek.jpeg"),
    "image/jpeg",
    1076,
    44,
    136,
    136,
    "cover",
    "ellipse",
    "Portrait of ILSP founder Patrick Vanden Broek, owner supplied",
  );
  const cards = [
    ["01", "Tel Aviv, 1973", "Born to an Israeli mother and Belgian father, Patrick’s connection to Israel began as family, identity and home."],
    ["02", "Belgium, 1982", "Moving countries changed the distance, not the bond. Culture, food, mentality and sport kept Israel close."],
    ["03", "The gap grew", "Barda, Itzhaki, Refaelov and other Israelis in Belgian football created interest without enough English context."],
    ["04", "Now: build it", "A decade-old idea becomes a daily newsroom and community for Israelis, Jews and every curious supporter."],
  ];
  cards.forEach((card, i) => {
    const x = 72 + i * 292;
    box(slide, x, 236, 268, 300, i === 0 ? C.navy : C.white, "rounded-2xl", i === 0 ? "none" : C.line, 1);
    text(slide, card[0], x + 24, 258, 58, 28, { fontSize: 14, bold: true, color: i === 0 ? C.live : C.blue });
    text(slide, card[1], x + 24, 307, 220, 66, { fontSize: 25, bold: true, color: i === 0 ? C.white : C.navy });
    text(slide, card[2], x + 24, 390, 220, 116, { fontSize: 16, color: i === 0 ? "#C7D3E4" : C.slate });
  });
  box(slide, 72, 570, 1136, 74, C.live, "rounded-xl");
  text(slide, "Founder commitment", 96, 588, 176, 34, { fontSize: 14, bold: true, color: C.navy });
  text(slide, "Passion starts it. Funding gives the newsroom people and time to last.", 280, 585, 880, 36, { fontSize: 24, bold: true, color: C.navy });
  footer(slide, 3, "ILSP founder story · 17 July 2026");
}

// 04 — Product evidence -------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  slideHeader(slide, "Product evidence", "The product exists today—not as a pitch-deck promise.", "A responsive local publication already combines dynamic headlines, fixtures, exact imagery and long-form reporting.");
  await addImage(slide, "homepage-desktop.png", 72, 218, 786, 372, "cover", "rounded-xl", "ILSP desktop homepage");
  await addImage(slide, "homepage-mobile.png", 902, 204, 235, 400, "cover", "rounded-2xl", "ILSP mobile homepage");
  box(slide, 1098, 214, 110, 110, C.navy, "rounded-xl");
  text(slide, "30\nMIN", 1098, 214, 110, 110, { fontSize: 26, bold: true, color: C.live, align: "center" });
  text(slide, "source cycle", 1094, 328, 118, 28, { fontSize: 11, bold: true, color: C.slate, align: "center" });
  box(slide, 1098, 382, 110, 110, C.blue, "rounded-xl");
  text(slide, "8", 1098, 386, 110, 58, { fontSize: 34, bold: true, color: C.white, align: "center" });
  text(slide, "candidates\nlast cycle", 1098, 440, 110, 44, { fontSize: 11, bold: true, color: "#DDE8FF", align: "center" });
  text(slide, "77 audit-clean published reports", 72, 610, 786, 32, { fontSize: 16, bold: true, color: C.navy });
  footer(slide, 4, "Source: ILSP local ingestion and content audit, 17 July 2026");
}

// 05 — Newsroom engine --------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  slideHeader(slide, "Newsroom engine", "Volume is discovered. Trust is earned at the gate.", "ONE and Sport5 lead source discovery by configured volume; every report still needs independent, claim-specific verification.", true);
  const steps = [
    ["01", "Discover", "All enabled sources\nevery 30 minutes"],
    ["02", "Verify", "Names, results, contracts\nand material claims"],
    ["03", "Report", "Original idiomatic English\n—not close translation"],
    ["04", "Unify", "URL, event-key and\nsemantic deduplication"],
    ["05", "Publish", "Professional word, fact\nand paragraph gate"],
    ["06", "Audit", "Homepage rank, image match,\nfreshness and corrections"],
  ];
  steps.forEach((step, i) => {
    const x = 72 + i * 188;
    box(slide, x, 232, 166, 238, i === 4 ? C.blue : C.navy2, "rounded-xl", i === 4 ? "none" : "#294362", 1);
    text(slide, step[0], x + 18, 250, 50, 26, { fontSize: 12, bold: true, color: C.live });
    text(slide, step[1], x + 18, 296, 130, 44, { fontSize: 23, bold: true, color: C.white });
    text(slide, step[2], x + 18, 360, 132, 80, { fontSize: 14, color: "#C7D3E4" });
    if (i < steps.length - 1) text(slide, "→", x + 164, 323, 24, 30, { fontSize: 19, bold: true, color: C.live, align: "center" });
  });
  const discoveryMix = [
    ["ONE", 3],
    ["Sport5", 3],
    ["Walla", 0],
    ["Ynet", 0],
    ["Sport1", 2],
  ];
  box(slide, 84, 617, 616, 1, "#294362", "none", "none", 0);
  discoveryMix.forEach(([source, value], i) => {
    const x = 100 + i * 120;
    const height = value === 0 ? 2 : (value / 3) * 70;
    box(slide, x, 617 - height, 50, height, value === 0 ? "#294362" : C.live, "none", "none", 0);
    text(slide, String(value), x, 530 + (70 - height), 50, 20, { fontSize: 12, bold: true, color: C.white, align: "center" });
    text(slide, source, x - 10, 622, 70, 20, { fontSize: 12, color: "#C7D3E4", align: "center" });
  });
  text(slide, "Latest discovery mix", 748, 522, 240, 30, { fontSize: 15, bold: true, color: C.white });
  text(slide, "8 candidates discovered. Zero auto-published: the review gate held when final verification was unavailable.", 748, 558, 390, 74, { fontSize: 17, color: "#C7D3E4" });
  footer(slide, 5, "Source: ILSP local ingestion report, 17 July 2026");
}

// 06 — Trust design -----------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.cream;
  slideHeader(slide, "Trust design", "Four controls separate ILSP from a content farm.", "The commercial model depends on a publication that supporters, rights holders and partners can safely share.");
  const controls = [
    ["VERIFIED", "Claim-specific research", "Material identities, scores, contracts and competition facts are checked against current authoritative records."],
    ["ORIGINAL", "Professional English reporting", "Substantial stories use natural sports terminology and clearly distinguish confirmed fact from uncertainty."],
    ["EXACT", "Rights-cleared action imagery", "No unrelated historical substitute; every public image must match the stated athlete, team, venue or event."],
    ["ACCOUNTABLE", "Corrections and audit trail", "Homepage promotions, timestamps, duplicates and public-facing professionalism are reviewed every cycle."],
  ];
  controls.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 72 + col * 576;
    const y = 224 + row * 188;
    box(slide, x, y, 544, 158, C.white, "rounded-xl", C.line, 1);
    pill(slide, item[0], x + 22, y + 20, 118, i === 2 ? C.blue : C.live, i === 2 ? C.white : C.navy);
    text(slide, item[1], x + 160, y + 14, 354, 48, { fontSize: 22, bold: true, color: C.navy });
    text(slide, item[2], x + 22, y + 74, 494, 66, { fontSize: 15, color: C.slate });
  });
  box(slide, 72, 620, 1136, 42, C.navy, "rounded-xl");
  text(slide, "Commercial support never buys coverage, rankings, facts or corrections.", 94, 620, 1092, 42, { fontSize: 16, bold: true, color: C.white, align: "center" });
  footer(slide, 6);
}

// 07 — Score centre -----------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  slideHeader(slide, "Product roadmap", "Scores turn reporting into a daily habit.", "Schedules, results, team marks and completed tables are connected. Licensed live events and deeper statistics are the funded next step—and the largest data dependency.");
  await addImage(slide, "scores-desktop.png", 72, 212, 720, 404, "cover", "rounded-xl", "ILSP scores centre");
  box(slide, 824, 212, 384, 176, C.pale, "rounded-xl");
  text(slide, "CONNECTED NOW", 848, 232, 184, 24, { fontSize: 12, bold: true, color: C.blue });
  text(slide, "Fixtures · recent results · league tables · team marks · competition filters", 848, 270, 322, 90, { fontSize: 19, bold: true, color: C.navy });
  box(slide, 824, 406, 384, 210, C.navy, "rounded-xl");
  text(slide, "FUNDED NEXT", 848, 426, 174, 24, { fontSize: 12, bold: true, color: C.live });
  text(slide, "Two-minute live scores\nStarting line-ups\nGoalscorers + incidents\nPlayer and match statistics\nBroad Israeli multi-sport depth", 848, 462, 320, 132, { fontSize: 18, color: C.white });
  footer(slide, 7, "Current product: local preview · Live-feed coverage subject to provider validation and licence");
}

// 08 — Audience flywheel ------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  slideHeader(slide, "Audience system", "One newsroom. Five reasons to return every day.", "The website is the source of truth; each channel turns verified reporting into a repeatable supporter habit.", true);
  await addImage(slide, "homepage-mobile.png", 492, 202, 296, 420, "cover", "rounded-2xl", "ILSP mobile product");
  const nodes = [
    ["Website", "Breaking news + depth", 72, 224],
    ["Newsletter", "Morning and evening Pulse", 72, 420],
    ["Social", "Fast verified distribution", 892, 224],
    ["Alerts + apps", "Match and story return", 892, 420],
  ];
  nodes.forEach((node, i) => {
    box(slide, node[2], node[3], 286, 132, i === 0 ? C.blue : C.navy2, "rounded-xl", i === 0 ? "none" : "#294362", 1);
    text(slide, node[0], node[2] + 22, node[3] + 18, 242, 38, { fontSize: 25, bold: true, color: C.white });
    text(slide, node[1], node[2] + 22, node[3] + 70, 242, 38, { fontSize: 15, color: "#C7D3E4" });
  });
  text(slide, "→", 380, 270, 76, 46, { fontSize: 28, bold: true, color: C.live, align: "center" });
  text(slide, "→", 822, 270, 52, 46, { fontSize: 28, bold: true, color: C.live, align: "center" });
  text(slide, "→", 380, 466, 76, 46, { fontSize: 28, bold: true, color: C.live, align: "center" });
  text(slide, "→", 822, 466, 52, 46, { fontSize: 28, bold: true, color: C.live, align: "center" });
  pill(slide, "DAILY ARCHIVE + QUIZ", 512, 636, 256);
  footer(slide, 8);
}

// 09 — Partner value ----------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.cream;
  slideHeader(slide, "Partner value", "What does the partner actually gain?", "A partner receives a defined audience product, measurable outcomes and category protection—not vague logo exposure.");
  const benefits = [
    ["01", "Visible relevance", "Presence on the selected ILSP product, launch moments and approved campaign surfaces."],
    ["02", "Audience access", "A credible route into English-speaking supporters of Israeli sport in Israel and worldwide."],
    ["03", "Measured proof", "Monthly delivery reporting and a quarterly impact review covering reach, usage and engagement."],
    ["04", "Purpose + trust", "Association with independent sport, diaspora connection and under-covered teams and athletes."],
  ];
  benefits.forEach((item, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 72 + col * 576;
    const y = 224 + row * 174;
    box(slide, x, y, 544, 146, i === 0 ? C.navy : C.white, "rounded-xl", i === 0 ? "none" : C.line, 1);
    text(slide, item[0], x + 22, y + 20, 42, 24, { fontSize: 12, bold: true, color: C.live });
    text(slide, item[1], x + 78, y + 14, 420, 42, { fontSize: 22, bold: true, color: i === 0 ? C.white : C.navy });
    text(slide, item[2], x + 22, y + 68, 496, 58, { fontSize: 15, color: i === 0 ? "#C7D3E4" : C.slate });
  });
  box(slide, 72, 586, 1136, 58, C.live, "rounded-xl");
  text(slide, "Founding advantage", 94, 586, 188, 58, { fontSize: 14, bold: true, color: C.navy });
  text(slide, "Early category position, launch association and a first renewal conversation—without editorial influence.", 286, 586, 890, 58, { fontSize: 18, bold: true, color: C.navy });
  text(slide, "Before audited traffic exists, ILSP sells a defined pilot and a baseline—not invented impressions or guaranteed reach.", 72, 652, 1050, 24, { fontSize: 11, color: C.slate });
  footer(slide, 9, "ILSP partner value framework · 17 July 2026");
}

// 10 — Outreach at scale ------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  slideHeader(slide, "Partner portfolio", "Hundreds in the universe. Every approach remains personal.", "The deck is a general foundation; each prospect receives a short, target-specific opening, relevant ask and approved attachment.", true);
  const funnel = [
    ["500", "target universe"],
    ["300", "personalised approaches"],
    ["30–60", "replies or referrals"],
    ["15–30", "meetings / reviews"],
    ["6–12", "proposals or pilots"],
    ["3–6", "funded / in-kind"],
  ];
  funnel.forEach((item, i) => {
    const x = 72 + i * 188;
    box(slide, x, 242, 166, 150, i === 1 ? C.blue : C.navy2, "rounded-xl", i === 1 ? "none" : "#294362", 1);
    text(slide, item[0], x + 12, 258, 142, 60, { fontSize: 31, bold: true, color: i === 1 ? C.white : C.live, align: "center" });
    text(slide, item[1], x + 16, 326, 134, 48, { fontSize: 13, bold: true, color: "#D3DEEC", align: "center" });
    if (i < funnel.length - 1) text(slide, "→", x + 164, 294, 24, 30, { fontSize: 19, bold: true, color: C.live, align: "center" });
  });
  box(slide, 72, 430, 544, 164, C.white, "rounded-xl");
  text(slide, "Operating cadence", 96, 448, 230, 32, { fontSize: 18, bold: true, color: C.navy });
  text(slide, "25 personalised openings per month\nTwo useful follow-ups at most\nCRM record, verified route and owner approval\nClose the sequence when there is no fit", 96, 486, 480, 94, { fontSize: 16, color: C.slate });
  box(slide, 640, 430, 568, 164, C.live, "rounded-xl");
  text(slide, "Planning funnel—not a promise", 666, 448, 500, 32, { fontSize: 18, bold: true, color: C.navy });
  text(slide, "The ranges are workload and conversion assumptions. They become forecasts only after real reply, meeting and proposal data exists.", 666, 492, 500, 72, { fontSize: 17, color: C.navy });
  footer(slide, 10, "ILSP twelve-month outreach operating plan · No external messages sent");
}

// 11 — Commercial inventory --------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.cream;
  slideHeader(slide, "Partner inventory", "Five sponsor products—not five prospects.", "Hundreds of organisations can receive a tailored proposal. Pricing remains illustrative until traffic, legal review and founder approval.");
  const offers = [
    ["FOUNDING", "$30k", "Launch association\n+ quarterly impact"],
    ["MATCH CENTRE", "$20k", "High-intent utility\n+ usage reporting"],
    ["DAILY PULSE", "$12k", "Newsletter presence\n+ campaign reporting"],
    ["ARCHIVE", "$10k", "Heritage positioning\n+ monthly reach"],
    ["WOMEN + YOUTH", "$12k", "Under-covered sport\n+ impact reporting"],
  ];
  offers.forEach((offer, i) => {
    const x = 72 + i * 228;
    box(slide, x, 228, 204, 270, i === 0 ? C.navy : C.white, "rounded-xl", i === 0 ? "none" : C.line, 1);
    text(slide, offer[0], x + 18, 248, 168, 28, { fontSize: 12, bold: true, color: i === 0 ? C.live : C.blue, align: "center" });
    text(slide, offer[1], x + 18, 298, 168, 60, { fontSize: 36, bold: true, color: i === 0 ? C.white : C.navy, align: "center" });
    text(slide, offer[2], x + 18, 382, 168, 66, { fontSize: 15, color: i === 0 ? "#C7D3E4" : C.slate, align: "center" });
  });
  box(slide, 72, 532, 1136, 92, C.pale, "rounded-xl");
  text(slide, "Every package includes", 94, 548, 220, 26, { fontSize: 14, bold: true, color: C.blue });
  text(slide, "Clear deliverables · category protection · brand-safety controls · performance reporting · editorial firewall", 304, 542, 866, 48, { fontSize: 18, bold: true, color: C.navy });
  text(slide, "No reader data sharing. No control over coverage. No unapproved discounts or promises.", 304, 584, 866, 24, { fontSize: 13, color: C.slate });
  footer(slide, 11);
}

// 12 — Funding ask ------------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.white;
  slideHeader(slide, "The ask", "The professional 12-month launch target: $213,790.", "A conservative founder-led model—not a fully staffed corporate newsroom. Public technology prices are verified; payroll, rights and data still require local quotes.");
  box(slide, 72, 214, 370, 170, C.navy, "rounded-2xl");
  text(slide, "$213,790", 94, 236, 326, 66, { fontSize: 46, bold: true, color: C.live, align: "center" });
  text(slide, "12-month cash target", 94, 312, 326, 34, { fontSize: 16, bold: true, color: C.white, align: "center" });
  const metrics = [
    ["$14,465", "monthly operating run rate"],
    ["$17,304", "one-time launch work"],
    ["$22,906", "contingency reserve"],
    ["$30,000", "indicative in-kind target"],
  ];
  metrics.forEach((metric, i) => {
    const x = 72 + (i % 2) * 188;
    const y = 410 + Math.floor(i / 2) * 104;
    box(slide, x, y, 176, 88, C.pale, "rounded-xl");
    text(slide, metric[0], x + 10, y + 12, 156, 34, { fontSize: 23, bold: true, color: C.blue, align: "center" });
    text(slide, metric[1], x + 12, y + 48, 152, 28, { fontSize: 10, bold: true, color: C.slate, align: "center" });
  });
  slide.charts.add("bar", {
    position: { left: 504, top: 228, width: 704, height: 332 },
    categories: ["Team + newsroom", "Product + data", "Admin + growth", "One-time launch", "Contingency"],
    series: [{ name: "USD", values: [123600, 30180, 19800, 17304, 22906], fill: C.blue }],
    hasLegend: false,
    dataLabels: { showValue: true, position: "outEnd", numberFormatCode: "$#,##0" },
    xAxis: { majorGridlines: { style: "solid", fill: C.line, width: 1 } },
  });
  box(slide, 504, 578, 704, 52, C.live, "rounded-xl");
  text(slide, "Recommended gate: one founding cash partner + one infrastructure/data partner before production purchases.", 522, 578, 668, 52, { fontSize: 15, bold: true, color: C.navy, align: "center" });
  text(slide, "MODEL STATUS: math reconciles · public platform fees checked · employment, media and production-data costs remain estimates", 504, 644, 704, 28, { fontSize: 10, bold: true, color: C.slate, align: "center" });
  footer(slide, 12, "Source: ILSP launch funding model · Public vendor prices rechecked 17 July 2026 · Quotes required before commitment");
}

// 13 — Roadmap ---------------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  slideHeader(slide, "12-month roadmap", "Fund the proof. Validate the habit. Scale only on evidence.", "Each phase has a release gate; apps and multilingual expansion follow a stable English newsroom and licensed data foundation.", true);
  const phases = [
    ["Q1", "FOUNDATION", "Brand + legal baseline\nProduction website\nNewsletter pilot\nScore-feed coverage test", "Cash + rights signed"],
    ["Q2", "HABIT", "Social cadence\nDaily archive + quiz\nScores expansion\nFirst partner report", "Retention evidence"],
    ["Q3", "MOBILE", "Android beta\niOS beta\nPush architecture\nSecond-language prototype", "Privacy + QA complete"],
    ["Q4", "SCALE", "Multi-sport depth\nPartner renewals\nYear-one impact\nRunway decision", "Audience + revenue proof"],
  ];
  phases.forEach((phase, i) => {
    const x = 72 + i * 284;
    box(slide, x, 226, 258, 354, i === 0 ? C.blue : C.navy2, "rounded-2xl", i === 0 ? "none" : "#294362", 1);
    pill(slide, phase[0], x + 20, 246, 54, i === 0 ? C.live : "#294362", i === 0 ? C.navy : C.white);
    text(slide, phase[1], x + 20, 298, 216, 44, { fontSize: 24, bold: true, color: C.white });
    text(slide, phase[2], x + 20, 362, 216, 130, { fontSize: 17, color: "#D3DEEC" });
    box(slide, x + 20, 508, 218, 50, i === 0 ? C.navy : "#0B1C32", "rounded-xl");
    text(slide, phase[3], x + 30, 508, 198, 50, { fontSize: 12, bold: true, color: C.live, align: "center" });
  });
  box(slide, 72, 610, 1136, 46, C.live, "rounded-xl");
  text(slide, "No app-store account, production deployment, data contract or external campaign is activated before the matching approval and funding gate.", 92, 610, 1096, 46, { fontSize: 14, bold: true, color: C.navy, align: "center" });
  footer(slide, 13);
}

// 14 — Close -----------------------------------------------------------------
{
  const slide = presentation.slides.add();
  slide.background.fill = C.navy;
  await addImage(slide, "homepage-desktop.png", 688, 0, 592, 720, "cover", "none", "ILSP homepage product");
  box(slide, 0, 0, 760, 720, C.navy, "none");
  pill(slide, "FOUNDING CONVERSATION", 72, 64, 204);
  text(slide, "Help build the daily home of Israeli sport in English.", 72, 132, 590, 170, { fontSize: 44, bold: true, color: C.white });
  text(slide, "We are seeking:", 72, 334, 220, 32, { fontSize: 15, bold: true, color: C.live });
  text(slide, "01  A founding cash partner\n02  A licensed data or infrastructure partner\n03  Mission-aligned distribution and grant partners", 72, 378, 560, 116, { fontSize: 22, color: "#D3DEEC" });
  box(slide, 72, 540, 544, 70, C.live, "rounded-xl");
  text(slide, "NEXT: 30-minute partner-fit and launch-gate review", 92, 540, 504, 70, { fontSize: 18, bold: true, color: C.navy, align: "center" });
  text(slide, "Israel Sports Pulse · ILSP · Planned primary domain: ilsportspulse.com (registration pending)", 72, 650, 600, 28, { fontSize: 10, color: "#8EA2BF" });
}

// Export all QA evidence and the editable deck.
for (const [index, slide] of presentation.slides.items.entries()) {
  const stem = `slide-${String(index + 1).padStart(2, "0")}`;
  const png = await presentation.export({ slide, format: "png", scale: 1 });
  await fs.writeFile(path.join(previewDir, `${stem}.png`), new Uint8Array(await png.arrayBuffer()));
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(path.join(previewDir, `${stem}.layout.json`), await layout.text());
}

const montage = await presentation.export({ format: "webp", montage: true, scale: 1 });
await fs.writeFile(path.join(previewDir, "deck-montage.webp"), new Uint8Array(await montage.arrayBuffer()));
const pptx = await PresentationFile.exportPptx(presentation);
await pptx.save(deckPath);

const inspection = await presentation.inspect({ kind: "slide,textbox,shape,image,chart", maxChars: 20000 });
await fs.writeFile(path.join(previewDir, "deck-inspect.ndjson"), inspection.ndjson);
console.log(JSON.stringify({ deckPath, previewDir, slides: presentation.slides.items.length }));
