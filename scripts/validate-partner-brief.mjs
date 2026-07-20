import { createHash } from "node:crypto";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");

const sourcePath = "docs/partner-one-page-brief.md";
const consistencyPath = "docs/partner-brief-consistency-check.md";
const pdfPath = "output/pdf/ilsp-founding-partner-brief.pdf";
const reportPath = "data/partner-brief-release-readiness.json";
const maxEvidenceAgeDays = 31;
const millisecondsPerDay = 86_400_000;

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function validatePartnerBriefInputs({ sourceText, consistencyText, pdfBuffer, sourceMtimeMs, consistencyMtimeMs, pdfMtimeMs, nowMs = Date.now() }) {
  const errors = [];
  const findings = [];
  const sourceRequirements = [
    ["USD 30,000", "The controlled USD 30,000 founding-partner position is missing."],
    ["twelve months", "The twelve-month term is missing."],
    ["Up to three non-competing", "The inventory limit of three non-competing positions is missing."],
    ["USD 213,790", "The twelve-month cash requirement is missing."],
    ["USD 30,000 in-kind target", "The separate in-kind target is missing."],
    ["English-reading sports audiences", "The English-language audience proposition is missing."],
    ["story approval", "The editorial-firewall restriction on story approval is missing."],
    ["subscriber-data access", "The editorial-firewall restriction on subscriber data is missing."],
    ["owner approval", "The owner-approval gate is missing."],
    ["Hebrew translation is not part of the current roadmap", "The current no-Hebrew-translation position is missing."],
  ];

  if (!sourceText?.trim()) errors.push("The editable partner brief is empty.");
  if (!consistencyText?.trim()) errors.push("The partner-pack consistency record is empty.");
  for (const [needle, message] of sourceRequirements) {
    if (!sourceText.includes(needle)) errors.push(message);
  }
  if (!consistencyText.includes("USD 30,000 for twelve months")) {
    errors.push("The consistency record does not confirm the controlled commercial position.");
  }
  if (/future Hebrew editions/i.test(sourceText) || /Hebrew translation is part/i.test(sourceText)) {
    errors.push("The brief reintroduces Hebrew editorial expansion contrary to the controlled roadmap.");
  }

  const pdfText = pdfBuffer?.toString("latin1") ?? "";
  const pageObjects = pdfText.match(/\/Type\s*\/Page\b/g)?.length ?? 0;
  if (!pdfBuffer?.subarray(0, 5).equals(Buffer.from("%PDF-"))) errors.push("The rendered artifact is not a valid PDF file.");
  if ((pdfBuffer?.length ?? 0) < 50_000) errors.push("The rendered partner brief is unexpectedly small or incomplete.");
  if (pageObjects !== 1) errors.push(`The rendered partner brief must contain exactly one page; found ${pageObjects}.`);
  if (!pdfText.includes("Israel Sports Pulse - Founding Partner Brief")) errors.push("The rendered PDF title metadata is missing.");
  if (!Number.isFinite(sourceMtimeMs) || !Number.isFinite(pdfMtimeMs) || pdfMtimeMs < sourceMtimeMs) {
    errors.push("The rendered PDF is older than the editable partner brief and must be rebuilt.");
  }
  const evidenceTimestamps = [sourceMtimeMs, consistencyMtimeMs, pdfMtimeMs].filter(Number.isFinite);
  const oldestEvidenceMtimeMs = evidenceTimestamps.length === 3 ? Math.min(...evidenceTimestamps) : NaN;
  const evidenceAgeDays = Number.isFinite(oldestEvidenceMtimeMs)
    ? Math.max(0, (nowMs - oldestEvidenceMtimeMs) / millisecondsPerDay)
    : NaN;
  const evidenceExpiresAt = Number.isFinite(oldestEvidenceMtimeMs)
    ? new Date(oldestEvidenceMtimeMs + maxEvidenceAgeDays * millisecondsPerDay).toISOString()
    : null;
  if (!Number.isFinite(consistencyMtimeMs)) {
    errors.push("The partner-pack consistency record has no usable modification timestamp.");
  }
  if (!Number.isFinite(evidenceAgeDays) || evidenceAgeDays > maxEvidenceAgeDays) {
    errors.push(`The partner-brief release evidence is older than ${maxEvidenceAgeDays} days and must be reviewed before owner use.`);
  }

  if (errors.length === 0) {
    findings.push("The editable brief retains the USD 30,000 twelve-month position and three-position inventory cap.");
    findings.push("The English-language audience, editorial firewall and no-current-Hebrew-translation position remain explicit.");
    findings.push("The rendered PDF is a current, non-empty single-page artifact with matching title metadata.");
    findings.push(`The editable brief, consistency record and rendered PDF are all within the ${maxEvidenceAgeDays}-day owner-review window.`);
  }

  return {
    valid: errors.length === 0,
    pageCount: pageObjects,
    sourceBytes: Buffer.byteLength(sourceText ?? "", "utf8"),
    pdfBytes: pdfBuffer?.length ?? 0,
    sourceSha256: sha256(sourceText ?? ""),
    pdfSha256: sha256(pdfBuffer ?? Buffer.alloc(0)),
    consistencySha256: sha256(consistencyText ?? ""),
    currentness: {
      maxAgeDays: maxEvidenceAgeDays,
      evidenceAgeDays: Number.isFinite(evidenceAgeDays) ? Number(evidenceAgeDays.toFixed(2)) : null,
      expiresAt: evidenceExpiresAt,
    },
    findings,
    errors,
  };
}

export function validatePartnerBrief(root = defaultRoot) {
  const sourceAbsolute = path.join(root, sourcePath);
  const pdfAbsolute = path.join(root, pdfPath);
  return validatePartnerBriefInputs({
    sourceText: readFileSync(sourceAbsolute, "utf8"),
    consistencyText: readFileSync(path.join(root, consistencyPath), "utf8"),
    pdfBuffer: readFileSync(pdfAbsolute),
    sourceMtimeMs: statSync(sourceAbsolute).mtimeMs,
    consistencyMtimeMs: statSync(path.join(root, consistencyPath)).mtimeMs,
    pdfMtimeMs: statSync(pdfAbsolute).mtimeMs,
  });
}

export function buildPartnerBriefReadinessReport(validation, now = new Date()) {
  return {
    checkedAt: now.toISOString(),
    visibility: "internal",
    valid: validation.valid,
    artifacts: {
      editableSource: { path: sourcePath, bytes: validation.sourceBytes, sha256: validation.sourceSha256 },
      consistencyRecord: { path: consistencyPath, sha256: validation.consistencySha256 },
      renderedPdf: { path: pdfPath, bytes: validation.pdfBytes, sha256: validation.pdfSha256, pages: validation.pageCount },
    },
    currentness: validation.currentness,
    controlledPosition: {
      price: "USD 30,000",
      term: "twelve months",
      maximumNonCompetingPositions: 3,
      ownerApprovalRequired: true,
    },
    findings: validation.findings,
    errors: validation.errors,
    nextExecutableAction: `Rebuild and rerun this preflight after any controlled change and refresh the owner-review evidence before ${validation.currentness.expiresAt ?? "its 31-day expiry"}.`,
    externalActionsTaken: [],
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const validation = validatePartnerBrief();
  const report = buildPartnerBriefReadinessReport(validation);
  writeFileSync(path.join(defaultRoot, reportPath), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ report: reportPath, ...validation }));
  if (!validation.valid) process.exitCode = 1;
}
