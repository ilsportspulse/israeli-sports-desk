import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  SpreadsheetFile,
  Workbook,
} from "/Users/patrickvandenbroek/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@oai/artifact-tool/dist/artifact_tool.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outputDir = path.join(projectRoot, "outputs");
const previewDir = path.join(outputDir, "funding-model-preview");
const outputPath = path.join(outputDir, "ilsp-launch-funding-model.xlsx");

await fs.mkdir(previewDir, { recursive: true });

const workbook = Workbook.create();
workbook.comments.setSelf({ displayName: "Israel Sports Pulse" });

const COLORS = {
  navy: "#071426",
  navy2: "#10233E",
  blue: "#155EEF",
  lime: "#C7F92A",
  white: "#FFFFFF",
  ink: "#111827",
  slate: "#667085",
  pale: "#F5F7FB",
  line: "#D8DEE9",
  green: "#168F5B",
  amber: "#D97706",
  red: "#C0392B",
};

const money = '$#,##0;[Red]-$#,##0';
const percent = "0%";

function setTitle(sheet, title, subtitle, endColumn = "H") {
  sheet.mergeCells(`A1:${endColumn}1`);
  sheet.getRange("A1").values = [[title]];
  sheet.getRange("A1").format = {
    fill: COLORS.navy,
    font: { bold: true, color: COLORS.white, size: 20 },
    verticalAlignment: "center",
  };
  sheet.getRange("A1").format.rowHeight = 34;
  sheet.mergeCells(`A2:${endColumn}2`);
  sheet.getRange("A2").values = [[subtitle]];
  sheet.getRange("A2").format = {
    fill: COLORS.navy2,
    font: { color: "#C9D5E8", italic: true, size: 10 },
    verticalAlignment: "center",
  };
  sheet.getRange("A2").format.rowHeight = 25;
}

function section(sheet, range, label) {
  sheet.getRange(range).merge();
  sheet.getRange(range.split(":")[0]).values = [[label]];
  sheet.getRange(range).format = {
    fill: COLORS.blue,
    font: { bold: true, color: COLORS.white, size: 11 },
    verticalAlignment: "center",
  };
}

function styleHeader(sheet, range) {
  sheet.getRange(range).format = {
    fill: COLORS.navy2,
    font: { bold: true, color: COLORS.white },
    verticalAlignment: "center",
    wrapText: true,
    borders: { bottom: { color: COLORS.lime, style: "continuous", weight: 2 } },
  };
}

function styleBody(sheet, range) {
  sheet.getRange(range).format = {
    font: { color: COLORS.ink, size: 10 },
    verticalAlignment: "top",
    wrapText: true,
    borders: {
      bottom: { color: COLORS.line, style: "continuous", weight: 1 },
    },
  };
}

// Assumptions -----------------------------------------------------------------
const assumptions = workbook.worksheets.add("Assumptions");
setTitle(
  assumptions,
  "ILSP LAUNCH ASSUMPTIONS",
  "Editable planning inputs in USD. Public prices are point-in-time references; estimates require quotes before commitment.",
  "H",
);

const assumptionRows = [
  ["One-time", "Domain portfolio and DNS setup", "One-time", 120, 180, 300, "Planning estimate", "Registrar quote required; no purchase authorised"],
  ["One-time", "Legal, entity and trademark setup", "One-time", 1500, 3500, 7500, "Planning estimate", "Local legal/accounting quote required"],
  ["One-time", "Initial product, design and accessibility hardening", "One-time", 2500, 7500, 18000, "Planning estimate", "Can be partly founder-built or in-kind"],
  ["One-time", "iOS and Android launch preparation", "One-time", 1500, 6000, 15000, "Planning estimate", "Includes build, store assets and QA; excludes annual operations"],
  ["One-time", "Apple Developer + Google Play registration", "One-time", 124, 124, 124, "Official public fees", "Apple $99/year plus Google Play $25 one-time"],
  ["Monthly", "Founder / managing editor", "Monthly", 1800, 3000, 4500, "Planning estimate", "Limited founder salary; local tax and benefits excluded"],
  ["Monthly", "Deputy editor / news desk", "Monthly", 0, 1800, 3200, "Planning estimate", "Professional and full scenarios"],
  ["Monthly", "Freelance reporting and contributors", "Monthly", 800, 2000, 5000, "Planning estimate", "Flexible pool across sports and languages"],
  ["Monthly", "Audience, social and newsletter", "Monthly", 0, 900, 2000, "Planning estimate", "Founder-covered in lean scenario"],
  ["Monthly", "Commercial partnerships and grants", "Monthly", 0, 1000, 2600, "Planning estimate", "Founder-led until funding"],
  ["Monthly", "Development and operations", "Monthly", 600, 1600, 4000, "Planning estimate", "Maintenance, scores and apps"],
  ["Monthly", "Web hosting and delivery", "Monthly", 20, 75, 300, "Public starting price + buffer", "Vercel Pro starts at $20/month; usage varies"],
  ["Monthly", "Database, storage and backups", "Monthly", 25, 75, 250, "Public starting price + buffer", "Supabase Pro starts at $25/month; usage varies"],
  ["Monthly", "Email and newsletter delivery", "Monthly", 0, 40, 160, "Public starting price + buffer", "Resend free tier then public paid tiers"],
  ["Monthly", "Monitoring, security and incident tools", "Monthly", 0, 75, 300, "Planning estimate", "Quote after traffic and retention requirements"],
  ["Monthly", "Football scores and statistics feed", "Monthly", 29, 250, 1500, "Public starting price + quote", "API-Football Ultra $29; higher assurance/coverage requires validation"],
  ["Monthly", "Israeli multi-sport data and rights", "Monthly", 0, 1000, 5000, "Quote required", "Do not assume football providers cover Israeli lower leagues and other sports"],
  ["Monthly", "Licensed action imagery and media", "Monthly", 0, 500, 2200, "Quote required", "Rights-cleared action coverage is a launch dependency"],
  ["Monthly", "AI-assisted translation and newsroom tools", "Monthly", 150, 500, 1500, "Planning estimate", "Human editorial gate remains mandatory"],
  ["Monthly", "Accounting, insurance and administration", "Monthly", 150, 450, 1200, "Planning estimate", "Local professional quotes required"],
  ["Monthly", "Audience launch and community activity", "Monthly", 200, 1200, 3500, "Planning estimate", "No paid acquisition before tracking is ready"],
  ["Rate", "Contingency reserve", "Rate", 0.10, 0.12, 0.15, "Planning policy", "Applied to one-time plus 12-month operating cost"],
];

assumptions.getRange("A4:H4").values = [["Cost type", "Line item", "Cadence", "Lean", "Professional", "Full", "Confidence", "Basis / constraint"]];
styleHeader(assumptions, "A4:H4");
assumptions.getRange(`A5:H${4 + assumptionRows.length}`).values = assumptionRows;
styleBody(assumptions, `A5:H${4 + assumptionRows.length}`);
assumptions.getRange("D5:F25").format.numberFormat = money;
assumptions.getRange("D26:F26").format.numberFormat = percent;
assumptions.getRange("A5:A26").conditionalFormats.addCustom('=A5="One-time"', { fill: "#EAF1FF", font: { color: COLORS.blue } });
assumptions.getRange("A5:A26").conditionalFormats.addCustom('=A5="Monthly"', { fill: "#ECFDF3", font: { color: COLORS.green } });
assumptions.getRange("G5:G26").conditionalFormats.addCustom('=ISNUMBER(SEARCH("Quote",G5))', { fill: "#FFF7E6", font: { color: COLORS.amber, bold: true } });
assumptions.freezePanes.freezeRows(4);
assumptions.getRange("A:H").format.rowHeight = 33;
assumptions.getRange("A:A").format.columnWidth = 13;
assumptions.getRange("B:B").format.columnWidth = 34;
assumptions.getRange("C:C").format.columnWidth = 12;
assumptions.getRange("D:F").format.columnWidth = 14;
assumptions.getRange("G:G").format.columnWidth = 24;
assumptions.getRange("H:H").format.columnWidth = 50;

// Summary ---------------------------------------------------------------------
const summary = workbook.worksheets.add("Summary");
setTitle(
  summary,
  "ISRAEL SPORTS PULSE — 12-MONTH FUNDING MODEL",
  "Decision model, not a budget commitment. Cash and in-kind support are counted only after signed confirmation.",
  "J",
);

section(summary, "A4:J4", "THE DECISION");
summary.getRange("A5:J5").merge();
summary.getRange("A5").values = [["Fund a professional, independent English-language Israeli sports newsroom and product—without weakening editorial standards to chase volume."]];
summary.getRange("A5:J5").format = {
  fill: "#EEF4FF",
  font: { bold: true, color: COLORS.navy, size: 13 },
  wrapText: true,
  verticalAlignment: "center",
};
summary.getRange("A5:J5").format.rowHeight = 48;

section(summary, "A7:J7", "SCENARIO COMPARISON");
summary.getRange("A8:D8").values = [["Metric", "Lean proof", "Professional launch", "Full newsroom"]];
styleHeader(summary, "A8:D8");
const summaryMetrics = [
  ["Monthly operating run rate", "=SUM(Assumptions!D10:D25)", "=SUM(Assumptions!E10:E25)", "=SUM(Assumptions!F10:F25)"],
  ["12-month operating cost", "=B9*12", "=C9*12", "=D9*12"],
  ["One-time launch cost", "=SUM(Assumptions!D5:D9)", "=SUM(Assumptions!E5:E9)", "=SUM(Assumptions!F5:F9)"],
  ["Contingency reserve", "=(B10+B11)*Assumptions!D26", "=(C10+C11)*Assumptions!E26", "=(D10+D11)*Assumptions!F26"],
  ["12-month cash target", "=SUM(B10:B12)", "=SUM(C10:C12)", "=SUM(D10:D12)"],
  ["Indicative in-kind target", 10000, 30000, 75000],
  ["Founder runway included?", "Limited", "Yes", "Yes"],
  ["Data coverage posture", "Football pilot", "Israeli core + major global", "Broad multi-sport + apps"],
];
summary.getRange("A9:D16").values = summaryMetrics;
styleBody(summary, "A9:D16");
summary.getRange("B9:D14").format.numberFormat = money;
summary.getRange("B13:D13").format = { fill: COLORS.lime, font: { bold: true, color: COLORS.navy, size: 12 }, numberFormat: money };

section(summary, "F7:J7", "FUNDING PRINCIPLE");
summary.getRange("F8:J13").merge();
summary.getRange("F8").values = [["ILSP is seeking funding and in-kind operating support. It is not sponsoring other organisations. Unconfirmed sponsorships, grants, donated services and projected advertising revenue are excluded from available cash. The professional scenario is the recommended minimum for a credible daily publication."]];
summary.getRange("F8:J13").format = {
  fill: COLORS.navy,
  font: { color: COLORS.white, size: 13 },
  wrapText: true,
  verticalAlignment: "center",
  horizontalAlignment: "left",
};

section(summary, "A18:D18", "WHAT FUNDING UNLOCKS");
summary.getRange("A19:D24").values = [
  ["01", "Reliable newsroom", "Professional editing, name verification, deduplication and 30-minute source monitoring", ""],
  ["02", "Trusted scores", "Licensed feeds, tables, line-ups, scorers and match-centre depth", ""],
  ["03", "Action imagery", "Current rights-cleared photos with exact story matching", ""],
  ["04", "Audience products", "Newsletter, social publishing, notifications, quizzes and daily archive", ""],
  ["05", "Mobile growth", "High-quality iOS and Android apps after product-market validation", ""],
  ["06", "Governance", "Corrections, rights, privacy, commercial separation and audit trails", ""],
];
styleBody(summary, "A19:D24");
summary.getRange("A19:A24").format = { font: { bold: true, color: COLORS.blue, size: 14 }, horizontalAlignment: "center" };
summary.getRange("B19:B24").format.font = { bold: true, color: COLORS.navy };
summary.getRange("A19:D24").format.rowHeight = 48;

summary.getRange("A27:J27").merge();
summary.getRange("A27").values = [["Recommended next gate: secure one founding cash partner plus one infrastructure/data partner before production deployment or account purchases."]];
summary.getRange("A27:J27").format = { fill: COLORS.lime, font: { bold: true, color: COLORS.navy, size: 12 }, wrapText: true, verticalAlignment: "center" };
summary.getRange("A27:J27").format.rowHeight = 38;

summary.getRange("A:A").format.columnWidth = 27;
summary.getRange("B:D").format.columnWidth = 19;
summary.getRange("E:E").format.columnWidth = 3;
summary.getRange("F:J").format.columnWidth = 15;
summary.freezePanes.freezeRows(2);

const scenarioChart = summary.charts.add("bar", summary.getRange("A8:D13"));
scenarioChart.title = "12-month cost structure by scenario";
scenarioChart.hasLegend = true;
scenarioChart.xAxis = { axisType: "textAxis", textStyle: { fontSize: 9 } };
scenarioChart.yAxis = { numberFormatCode: "$#,##0" };
scenarioChart.setPosition("F14", "J25");

// Monthly model ---------------------------------------------------------------
const monthly = workbook.worksheets.add("Monthly Model");
setTitle(monthly, "MONTHLY OPERATING MODEL", "Recurring cash requirement by scenario; one-time launch costs and contingency are shown separately on Summary.", "G");
monthly.getRange("A4:G4").values = [["Month", "Lean recurring", "Professional recurring", "Full recurring", "Professional cumulative", "Milestone", "Release gate"]];
styleHeader(monthly, "A4:G4");
const milestoneRows = [
  ["Month 1", "Brand, legal and partner evidence pack", "No public launch without rights/privacy baseline"],
  ["Month 2", "Production web launch + newsletter pilot", "Hosting/data commitments signed"],
  ["Month 3", "Scores pilot for priority Israeli leagues", "Coverage and licensing validated"],
  ["Month 4", "Social publishing cadence", "Account ownership + 2FA complete"],
  ["Month 5", "First sponsor performance report", "No editorial interference"],
  ["Month 6", "Product and audience review", "Continue only with retention evidence"],
  ["Month 7", "Android beta if funded", "Store/legal requirements complete"],
  ["Month 8", "iOS beta if funded", "QA and privacy review complete"],
  ["Month 9", "Second-language prototype", "English operation stable first"],
  ["Month 10", "Expanded multi-sport data", "Provider coverage verified"],
  ["Month 11", "Renewal pipeline", "Partner reporting delivered"],
  ["Month 12", "Year-one impact and runway decision", "Board/founder approval"],
];
for (let i = 0; i < milestoneRows.length; i += 1) {
  const row = 5 + i;
  monthly.getRange(`A${row}`).values = [[milestoneRows[i][0]]];
  monthly.getRange(`B${row}:D${row}`).formulas = [["=Summary!B9", "=Summary!C9", "=Summary!D9"]];
  monthly.getRange(`E${row}`).formulas = [[`=SUM($C$5:C${row})`]];
  monthly.getRange(`F${row}:G${row}`).values = [[milestoneRows[i][1], milestoneRows[i][2]]];
}
styleBody(monthly, "A5:G16");
monthly.getRange("B5:E16").format.numberFormat = money;
monthly.getRange("A17:E17").values = [["12-month total", "=SUM(B5:B16)", "=SUM(C5:C16)", "=SUM(D5:D16)", "=E16"]];
monthly.getRange("A17:E17").format = { fill: COLORS.lime, font: { bold: true, color: COLORS.navy }, numberFormat: money };
monthly.getRange("A:A").format.columnWidth = 13;
monthly.getRange("B:E").format.columnWidth = 20;
monthly.getRange("F:F").format.columnWidth = 40;
monthly.getRange("G:G").format.columnWidth = 44;
monthly.freezePanes.freezeRows(4);
const monthlyChart = monthly.charts.add("line", monthly.getRange("A4:D16"));
monthlyChart.title = "Recurring cost by scenario";
monthlyChart.hasLegend = true;
monthlyChart.xAxis = { axisType: "textAxis" };
monthlyChart.yAxis = { numberFormatCode: "$#,##0" };
monthlyChart.setPosition("I4", "P18");

// Funding design --------------------------------------------------------------
const funding = workbook.worksheets.add("Funding Design");
setTitle(funding, "FUNDING DESIGN", "Illustrative inventory and asks. Nothing is sold, promised or externally sent without founder approval.", "H");
funding.getRange("A4:H4").values = [["Offer", "Cash ask", "Term", "Available units", "Partner outcome", "ILSP delivery", "Editorial firewall", "Status"]];
styleHeader(funding, "A4:H4");
const fundingRows = [
  ["Founding partner", 30000, "12 months", 3, "Visible association with the launch", "Brand presence, launch acknowledgement, quarterly impact report", "No influence over stories, ranking or corrections", "Draft inventory"],
  ["Match Centre partner", 20000, "12 months", 1, "High-intent utility audience", "Named score-centre integration and usage reporting", "No betting prompts; data accuracy gate", "Draft inventory"],
  ["Daily Pulse newsletter partner", 12000, "12 months", 1, "Direct recurring reader relationship", "Sponsor line and campaign reporting", "No access to subscriber data", "Draft inventory"],
  ["From the Archive partner", 10000, "12 months", 1, "Cultural and heritage positioning", "Presented-by lockup and monthly reach report", "No choice of historical conclusions", "Draft inventory"],
  ["Women & youth sport partner", 12000, "12 months", 1, "Support under-covered Israeli sport", "Section support and impact reporting", "Coverage decisions remain editorial", "Draft inventory"],
  ["Technology/data in-kind partner", 15000, "12 months", 3, "Product proof and case study", "Disclosed infrastructure/data support", "Service support does not buy coverage", "Target in-kind"],
  ["Jewish/diaspora access grant", 25000, "Project grant", 4, "English access to Israeli sport worldwide", "Milestone and outcome reporting", "Grant does not determine editorial line", "Target grant"],
];
funding.getRange("A5:H11").values = fundingRows;
styleBody(funding, "A5:H11");
funding.getRange("B5:B11").format.numberFormat = money;
funding.getRange("A13:D13").values = [["Illustrative cash stack", "Units", "Unit value", "Potential cash"]];
styleHeader(funding, "A13:D13");
funding.getRange("A14:C18").values = [
  ["Founding partners", 3, 30000],
  ["Product partners", 3, 14000],
  ["Project grants", 2, 25000],
  ["Launch memberships / donors", 200, 100],
  ["Events and other", 1, 10000],
];
funding.getRange("D14:D18").formulas = [["=B14*C14"], ["=B15*C15"], ["=B16*C16"], ["=B17*C17"], ["=B18*C18"]];
styleBody(funding, "A14:D18");
funding.getRange("C14:D18").format.numberFormat = money;
funding.getRange("A19:D19").values = [["Illustrative total", "", "", "=SUM(D14:D18)"]];
funding.getRange("A19:D19").format = { fill: COLORS.lime, font: { bold: true, color: COLORS.navy }, numberFormat: money };
funding.getRange("F13:H13").values = [["Commercial guardrail", "Rule", "Owner"]];
styleHeader(funding, "F13:H13");
funding.getRange("F14:H18").values = [
  ["External contact", "Founder approval before send", "Founder"],
  ["Pricing", "No discount or promise without approval", "Founder"],
  ["Editorial", "Commercial team cannot rank or suppress stories", "Editor"],
  ["Data", "No reader data shared with partners", "Privacy owner"],
  ["Renewal", "Performance report before renewal ask", "Commercial lead"],
];
styleBody(funding, "F14:H18");
funding.getRange("A:A").format.columnWidth = 27;
funding.getRange("B:B").format.columnWidth = 14;
funding.getRange("C:D").format.columnWidth = 16;
funding.getRange("E:G").format.columnWidth = 35;
funding.getRange("H:H").format.columnWidth = 17;
funding.freezePanes.freezeRows(4);

// Partner pipeline ------------------------------------------------------------
const pipeline = workbook.worksheets.add("Partner Pipeline");
setTitle(pipeline, "PARTNER PIPELINE FRAMEWORK", "Research map only—no accounts registered and no messages sent.", "I");
pipeline.getRange("A4:I4").values = [["Priority", "Partner category", "Example profile", "Need solved", "Suggested ask", "Cash / in-kind", "Evidence needed", "Status", "Next controlled action"]];
styleHeader(pipeline, "A4:I4");
const pipelineRows = [
  [1, "Israeli broadcast / streaming", "Sports or entertainment platform", "Launch cash + video access", "$25k–$50k", "Cash + rights", "Audience fit, rights scope, exclusivity", "Research", "Create shortlist and founder-approved outreach"],
  [1, "Banking / payments", "Israeli bank, card or fintech", "Founding cash partner", "$25k–$50k", "Cash", "Brand safety, diaspora reach, reporting", "Research", "Map sponsorship decision-makers"],
  [1, "Cloud / technology", "Hosting, database, AI or security provider", "Infrastructure runway", "$10k–$30k value", "In-kind", "Usage forecast and case-study terms", "Research", "Request startup/media support after approval"],
  [1, "Sports data", "Licensed scores and statistics provider", "Accurate match centre", "$10k–$40k value", "In-kind + cash", "Israeli league/sport coverage proof", "Research", "Run coverage matrix before approach"],
  [2, "Jewish and diaspora institutions", "Foundation, federation or community network", "Access grant and distribution", "$15k–$50k", "Grant + distribution", "Mission alignment and measurable access", "Research", "Build grant calendar and eligibility file"],
  [2, "Travel / airline / tourism", "Israel-facing carrier or travel brand", "Audience and event integrations", "$15k–$30k", "Cash + inventory", "Travel audience, geopolitical sensitivity", "Research", "Prepare safe category concept"],
  [2, "Sportswear / equipment", "Global or Israeli sports brand", "Section and event support", "$10k–$25k", "Cash + product", "Rights, athlete conflicts, category exclusivity", "Research", "Map non-conflicting inventory"],
  [3, "Education / universities", "Sports science, media or Israel studies", "Research and internship capacity", "$5k–$15k", "Grant + in-kind", "Editorial independence and supervision", "Research", "Develop structured internship proposal"],
];
pipeline.getRange("A5:I12").values = pipelineRows;
styleBody(pipeline, "A5:I12");
pipeline.getRange("A5:A12").conditionalFormats.add("colorScale", { criteria: [{ type: "lowestValue", color: "#E6F4EA" }, { type: "percentile", value: 50, color: "#FFF7E6" }, { type: "highestValue", color: "#FDECEC" }] });
pipeline.getRange("A:A").format.columnWidth = 10;
pipeline.getRange("B:B").format.columnWidth = 27;
pipeline.getRange("C:D").format.columnWidth = 31;
pipeline.getRange("E:F").format.columnWidth = 18;
pipeline.getRange("G:G").format.columnWidth = 38;
pipeline.getRange("H:H").format.columnWidth = 16;
pipeline.getRange("I:I").format.columnWidth = 37;
pipeline.freezePanes.freezeRows(4);

// Sources ---------------------------------------------------------------------
const sources = workbook.worksheets.add("Sources");
setTitle(sources, "PUBLIC PRICE SOURCES", "Official pages checked 15 July 2026. Prices may change; verify again before purchase or signing.", "F");
sources.getRange("A4:F4").values = [["Area", "Provider", "Public fact used", "Currency", "Source URL", "Model treatment"]];
styleHeader(sources, "A4:F4");
const sourceRows = [
  ["Hosting", "Vercel", "Pro starts at $20/month with included usage credit", "USD", "https://vercel.com/pricing", "Professional production starting point; usage buffer added"],
  ["Database", "Supabase", "Pro starts at $25/month", "USD", "https://supabase.com/pricing", "Professional production starting point; usage buffer added"],
  ["Football data", "API-Football", "Ultra is $29/month for 75,000 requests/day", "USD", "https://www.api-football.com/pricing", "Lean technical pilot only; coverage and licence must be validated"],
  ["Football data", "Sportmonks", "Plans start at €29/month; Pro starts at €249 monthly or €199 on annual billing", "EUR", "https://www.sportmonks.com/football-api/plans-pricing/", "Comparison reference; Israeli coverage and multi-sport require quote"],
  ["Email", "Resend", "Free 3,000 emails/month; Pro $20/month for 50,000", "USD", "https://resend.com/docs/knowledge-base/what-is-resend-pricing", "Free at proof stage; paid buffer in professional scenario"],
  ["iOS", "Apple", "Developer Program is $99 per membership year", "USD", "https://developer.apple.com/programs/whats-included/", "One-year fee included once authorised"],
  ["Android", "Google Play", "Play Console registration is a $25 one-time fee", "USD", "https://support.google.com/googleplay/android-developer/answer/6112435", "One-time fee included once authorised"],
];
sources.getRange("A5:F11").values = sourceRows;
styleBody(sources, "A5:F11");
sources.getRange("E5:E11").format.font = { color: COLORS.blue, underline: true };
sources.getRange("A:A").format.columnWidth = 18;
sources.getRange("B:B").format.columnWidth = 20;
sources.getRange("C:C").format.columnWidth = 48;
sources.getRange("D:D").format.columnWidth = 12;
sources.getRange("E:E").format.columnWidth = 62;
sources.getRange("F:F").format.columnWidth = 48;
sources.freezePanes.freezeRows(4);

// Checks ----------------------------------------------------------------------
const checks = workbook.worksheets.add("Checks");
setTitle(checks, "MODEL CHECKS", "All tests should read PASS before the model is used in a partner discussion.", "D");
checks.getRange("A4:D4").values = [["Check", "Formula / test", "Result", "Status"]];
styleHeader(checks, "A4:D4");
const checkRows = [
  ["Lean cash target reconciles", "Summary components", "=Summary!B13-(Summary!B10+Summary!B11+Summary!B12)", '=IF(ABS(C5)<0.01,"PASS","FAIL")'],
  ["Professional cash target reconciles", "Summary components", "=Summary!C13-(Summary!C10+Summary!C11+Summary!C12)", '=IF(ABS(C6)<0.01,"PASS","FAIL")'],
  ["Full cash target reconciles", "Summary components", "=Summary!D13-(Summary!D10+Summary!D11+Summary!D12)", '=IF(ABS(C7)<0.01,"PASS","FAIL")'],
  ["Monthly professional total reconciles", "12 recurring months", "='Monthly Model'!C17-Summary!C10", '=IF(ABS(C8)<0.01,"PASS","FAIL")'],
  ["Contingency rates are bounded", "0% to 25%", "=MAX(Assumptions!D26:F26)", '=IF(AND(C9>=0,C9<=0.25),"PASS","FAIL")'],
  ["No negative assumptions", "All numeric inputs", "=MIN(Assumptions!D5:F26)", '=IF(C10>=0,"PASS","FAIL")'],
  ["Public sources listed", "Minimum seven", "=COUNTA(Sources!E5:E11)", '=IF(C11>=7,"PASS","FAIL")'],
];
checks.getRange("A5:D11").values = checkRows;
styleBody(checks, "A5:D11");
checks.getRange("C5:C10").format.numberFormat = "0.00";
checks.getRange("D5:D11").conditionalFormats.addCustom('=D5="PASS"', { fill: "#DDF7E8", font: { color: COLORS.green, bold: true } });
checks.getRange("D5:D11").conditionalFormats.addCustom('=D5="FAIL"', { fill: "#FDECEC", font: { color: COLORS.red, bold: true } });
checks.getRange("A:A").format.columnWidth = 39;
checks.getRange("B:B").format.columnWidth = 26;
checks.getRange("C:C").format.columnWidth = 18;
checks.getRange("D:D").format.columnWidth = 14;

// Add source comments to the directly referenced public-price assumptions.
const sourceComments = [
  ["D16", "Source: https://vercel.com/pricing — Pro starts at $20/month. Verify before purchase."],
  ["D17", "Source: https://supabase.com/pricing — Pro starts at $25/month. Verify before purchase."],
  ["D18", "Source: https://resend.com/docs/knowledge-base/what-is-resend-pricing — free and paid tiers. Verify before purchase."],
  ["D20", "Source: https://www.api-football.com/pricing — Ultra $29/month. Coverage/licensing validation required."],
  ["D9", "Sources: Apple $99/year and Google Play $25 one-time. No registration authorised."],
];
for (const [cell, comment] of sourceComments) {
  workbook.comments.addThread({ cell: assumptions.getRange(cell) }, comment);
}

// Export and render every sheet for visual QA.
const exported = await SpreadsheetFile.exportXlsx(workbook);
await exported.save(outputPath);

for (const sheet of workbook.worksheets.items) {
  const preview = await workbook.render({
    sheetName: sheet.name,
    autoCrop: "all",
    scale: 1,
    format: "png",
  });
  const safeName = sheet.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  await fs.writeFile(path.join(previewDir, `${safeName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

console.log(JSON.stringify({ outputPath, previewDir, sheets: workbook.worksheets.items.map((sheet) => sheet.name) }));
