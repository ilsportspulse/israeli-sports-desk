import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");

const requiredPlaceholders = [
  "[OWNER-APPROVED PRODUCTION URL]",
  "[OWNER-CONTROLLED DOMAIN EMAIL]",
  "[OWNER-CONTROLLED ACCOUNT ID]",
  "[CURRENT DEVELOPMENT RECIPIENT]",
  "[OWNER-APPROVED SENDER NAME]",
  "[OWNER-CONTROLLED ILSP EMAIL]",
  "[OWNER-APPROVED WEBSITE]",
];

const routeEvidenceMaxAgeDays = 31;

function evidenceAgeDays(value, now) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return (now.getTime() - timestamp) / 86_400_000;
}

export function validatePartnerSubmissionInputs({ decisionBrief, drafts, onePageBrief, consistencyCheck, prospects, now = new Date() }) {
  const errors = [];
  const findings = [];
  const evidenceAges = [];

  for (const [label, text] of Object.entries({ decisionBrief, drafts, onePageBrief, consistencyCheck })) {
    if (!text?.trim()) errors.push(`${label} is empty.`);
  }

  for (const text of [decisionBrief, onePageBrief, consistencyCheck]) {
    if (!text.includes("USD 30,000")) errors.push("The USD 30,000 twelve-month founding-partner anchor is inconsistent or missing.");
  }
  for (const text of [decisionBrief, drafts]) {
    if (!text.includes("USD 2,110")) errors.push("The AWS twelve-month planning forecast is inconsistent or missing.");
  }
  if (!/eight-week non-cash pilot/i.test(decisionBrief)) errors.push("The Maccabi route must remain an eight-week non-cash pilot.");
  if (!/opening proposal is non-cash/i.test(drafts)) errors.push("The Maccabi submission draft must keep its opening ask non-cash.");

  for (const placeholder of requiredPlaceholders) {
    if (!drafts.includes(placeholder)) errors.push(`Submission draft is missing hard-stop placeholder ${placeholder}.`);
  }
  const pendingCells = drafts.match(/\[PENDING\]/g)?.length ?? 0;
  if (pendingCells !== 12) errors.push("The two-route decision record must retain exactly twelve pending approval cells.");
  if (drafts.includes("[APPROVED]")) errors.push("No submission decision may be pre-approved.");
  if (!/owner explicitly authorises and performs the submission/i.test(drafts)) errors.push("The AWS submission must remain owner-performed.");
  if (!/owner explicitly authorises sending the final message/i.test(drafts)) errors.push("The Maccabi message must retain an explicit owner send gate.");

  const prospectById = new Map(prospects.map((prospect) => [prospect.id, prospect]));
  const aws = prospectById.get("aws-activate");
  const maccabi = prospectById.get("maccabi-world-union");
  for (const [id, prospect] of [["aws-activate", aws], ["maccabi-world-union", maccabi]]) {
    if (!prospect) errors.push(`Missing qualified prospect ${id}.`);
    else {
      if (prospect.ownerApprovalRequired !== true) errors.push(`${id} must retain owner approval.`);
      if (!prospect.status?.includes("pending-owner")) errors.push(`${id} must remain pending owner approval.`);
      if (!prospect.localProposalArtifact?.startsWith("docs/")) errors.push(`${id} must retain a local proposal artifact.`);
      if (!prospect.routeUrl?.startsWith("https://") || !prospect.evidenceUrl?.startsWith("https://")) errors.push(`${id} must retain HTTPS route evidence.`);
      const age = evidenceAgeDays(prospect.qualifiedAt, now);
      if (age === null || age < -1 || age > routeEvidenceMaxAgeDays) errors.push(`${id} qualification evidence must be dated within ${routeEvidenceMaxAgeDays} days.`);
      else evidenceAges.push(age);
    }
  }

  for (const id of ["bank-hapoalim", "bank-leumi", "yes-israel"]) {
    const prospect = prospectById.get(id);
    if (!prospect?.status?.startsWith("hold-")) errors.push(`${id} must remain on hold until a legitimate route exists.`);
    if (prospect?.ownerApprovalRequired !== true) errors.push(`${id} must retain owner approval.`);
    const age = evidenceAgeDays(prospect?.routeResearchedAt, now);
    if (age === null || age < -1 || age > routeEvidenceMaxAgeDays) errors.push(`${id} route research must be dated within ${routeEvidenceMaxAgeDays} days.`);
    else evidenceAges.push(age);
  }

  if (errors.length === 0) {
    findings.push("The USD 30,000 founding anchor remains separate from the AWS credit and Maccabi non-cash routes.");
    findings.push("Seven hard-stop placeholders and twelve pending decision cells remain intact.");
    findings.push("Both qualified routes and all three held routes retain owner-approval gates.");
    findings.push(`All five route-evidence records are within the ${routeEvidenceMaxAgeDays}-day freshness window.`);
  }

  return {
    valid: errors.length === 0,
    qualifiedRoutes: [aws, maccabi].filter(Boolean).length,
    heldRoutes: ["bank-hapoalim", "bank-leumi", "yes-israel"].filter((id) => prospectById.get(id)?.status?.startsWith("hold-")).length,
    hardStopPlaceholders: requiredPlaceholders.length,
    pendingDecisionCells: pendingCells,
    routeEvidenceMaxAgeDays,
    oldestRouteEvidenceAgeDays: evidenceAges.length ? Number(Math.max(...evidenceAges).toFixed(1)) : null,
    findings,
    errors,
  };
}

export function validatePartnerSubmissionPack(root = defaultRoot) {
  return validatePartnerSubmissionInputs({
    decisionBrief: readFileSync(path.join(root, "docs/partner-owner-decision-brief.md"), "utf8"),
    drafts: readFileSync(path.join(root, "docs/partner-first-two-submission-drafts.md"), "utf8"),
    onePageBrief: readFileSync(path.join(root, "docs/partner-one-page-brief.md"), "utf8"),
    consistencyCheck: readFileSync(path.join(root, "docs/partner-brief-consistency-check.md"), "utf8"),
    prospects: JSON.parse(readFileSync(path.join(root, "data/partner-prospects.json"), "utf8")),
  });
}

export function buildPartnerReadinessReport(prospects, validation, now = new Date()) {
  const routeIds = ["aws-activate", "maccabi-world-union", "bank-hapoalim", "bank-leumi", "yes-israel"];
  const prospectById = new Map(prospects.map((prospect) => [prospect.id, prospect]));
  const routes = routeIds.map((id) => {
    const prospect = prospectById.get(id);
    const evidenceAt = id === "aws-activate" || id === "maccabi-world-union"
      ? prospect?.qualifiedAt
      : prospect?.routeResearchedAt;
    const age = evidenceAgeDays(evidenceAt, now);
    const expiresAt = Number.isFinite(Date.parse(evidenceAt))
      ? new Date(Date.parse(evidenceAt) + routeEvidenceMaxAgeDays * 86_400_000).toISOString()
      : null;
    return {
      id,
      organisation: prospect?.organisation ?? null,
      status: prospect?.status ?? "missing",
      evidenceAt: evidenceAt ?? null,
      expiresAt,
      ageDays: age === null ? null : Number(age.toFixed(1)),
      daysUntilExpiry: age === null ? null : Number((routeEvidenceMaxAgeDays - age).toFixed(1)),
      ownerApprovalRequired: prospect?.ownerApprovalRequired === true,
      routeUrl: prospect?.routeUrl ?? null,
      evidenceUrl: prospect?.evidenceUrl ?? null,
    };
  });

  return {
    checkedAt: now.toISOString(),
    visibility: "internal",
    valid: validation.valid,
    routeEvidenceMaxAgeDays,
    routes,
    controls: {
      qualifiedRoutes: validation.qualifiedRoutes,
      heldRoutes: validation.heldRoutes,
      hardStopPlaceholders: validation.hardStopPlaceholders,
      pendingDecisionCells: validation.pendingDecisionCells,
    },
    findings: validation.findings,
    errors: validation.errors,
    nextExecutableAction: "Refresh each route from its official evidence before expiry; no application or message may proceed without explicit owner approval.",
    externalActionsTaken: [],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const now = new Date();
  const validation = validatePartnerSubmissionPack();
  const prospects = JSON.parse(readFileSync(path.join(defaultRoot, "data/partner-prospects.json"), "utf8"));
  const readiness = buildPartnerReadinessReport(prospects, validation, now);
  writeFileSync(path.join(defaultRoot, "data/partner-submission-readiness.json"), `${JSON.stringify(readiness, null, 2)}\n`);
  const result = { checkedAt: now.toISOString(), report: "data/partner-submission-readiness.json", ...validation };
  console.log(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}
