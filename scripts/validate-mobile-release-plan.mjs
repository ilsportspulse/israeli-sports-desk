import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");
const expectedGates = ["contracts-prototype", "internal-alpha", "private-beta", "public-beta-candidate", "store-launch"];
const expectedContractFiles = [
  "packages/api-contracts/schemas/article-detail.schema.json",
  "packages/api-contracts/fixtures/article-detail.football.json",
  "packages/api-contracts/fixtures/article-detail.basketball.json",
  "packages/api-contracts/fixtures/article-detail.basketball-club.json",
];

export function validateMobileReleasePlanRecord(record, responsiveReport, now = new Date(), root = defaultRoot) {
  const errors = [];
  const findings = [];

  if (record.visibility !== "internal") errors.push("The mobile release plan must remain internal.");
  if (!Array.isArray(record.externalActionsTaken) || record.externalActionsTaken.length !== 0) {
    errors.push("Mobile external actions must remain empty until owner approval.");
  }

  const products = record.decision?.products ?? [];
  if (products.length !== 2 || !products.includes("iOS") || !products.includes("Android")) {
    errors.push("The shared-client decision must retain both iOS and Android products.");
  }

  const gates = Array.isArray(record.releaseGates) ? record.releaseGates : [];
  const gateIds = gates.map((gate) => gate.id);
  if (gates.length !== expectedGates.length || expectedGates.some((id) => !gateIds.includes(id)) || new Set(gateIds).size !== gates.length) {
    errors.push("All five unique mobile release gates must remain present.");
  }
  for (const id of ["private-beta", "public-beta-candidate", "store-launch"]) {
    const gate = gates.find((item) => item.id === id);
    if (!gate || gate.status !== "gated" || gate.externalApprovalRequired !== true) {
      errors.push(`${id} must remain gated behind explicit external approval.`);
    }
  }
  for (const id of ["contracts-prototype", "internal-alpha"]) {
    const gate = gates.find((item) => item.id === id);
    if (!gate || gate.externalApprovalRequired !== false) errors.push(`${id} must remain a local-only gate.`);
  }

  const contractGate = gates.find((gate) => gate.id === "contracts-prototype");
  if (!/responsive-web-proof/i.test(contractGate?.status ?? "")) {
    errors.push("Gate 0 must record the completed responsive web proof without claiming native acceptance.");
  }
  for (const relativePath of contractGate?.evidence ?? []) {
    if (!fs.existsSync(path.join(root, relativePath))) errors.push(`Recorded Gate 0 evidence is missing: ${relativePath}`);
  }

  const freshness = record.evidenceFreshness ?? {};
  const evidenceTime = Date.parse(freshness.responsiveWebEvidenceAt ?? "");
  const reportTime = Date.parse(responsiveReport?.checkedAt ?? "");
  const contractTime = Date.parse(freshness.apiContractValidatorLastPassedAt ?? "");
  const maxAgeHours = Number(freshness.maxEvidenceAgeHours);
  const evidenceAgeHours = Number.isFinite(evidenceTime) ? (now.getTime() - evidenceTime) / 3_600_000 : Number.NaN;
  const contractAgeHours = Number.isFinite(contractTime) ? (now.getTime() - contractTime) / 3_600_000 : Number.NaN;
  const evidenceExpiresAt = Number.isFinite(evidenceTime) && Number.isFinite(maxAgeHours)
    ? new Date(evidenceTime + maxAgeHours * 3_600_000).toISOString()
    : null;

  if (!Number.isFinite(maxAgeHours) || maxAgeHours <= 0 || !Number.isFinite(evidenceAgeHours)) {
    errors.push("Responsive mobile evidence needs a valid timestamp and positive maximum age.");
  } else if (evidenceAgeHours < -0.05) {
    errors.push("Responsive mobile evidence cannot be dated in the future.");
  } else if (evidenceAgeHours > maxAgeHours) {
    errors.push(`Responsive mobile evidence is older than ${maxAgeHours} hours and must be refreshed.`);
  }
  if (!Number.isFinite(reportTime) || reportTime !== evidenceTime) errors.push("The release plan timestamp must match the responsive QA report.");
  if (freshness.responsiveWebEvidenceValidUntil !== evidenceExpiresAt) errors.push("The recorded responsive evidence expiry is inconsistent.");
  if (!Number.isFinite(contractAgeHours) || contractAgeHours < -0.05 || contractAgeHours > maxAgeHours) {
    errors.push(`API contract validation evidence must be current within ${maxAgeHours} hours.`);
  }
  if (freshness.nativeSimulatorEvidenceAt !== null || !/^blocked-/i.test(freshness.nativeAcceptanceStatus ?? "")) {
    errors.push("Native evidence must remain explicitly blocked until real simulator runs exist.");
  }

  const snapshot = record.contractSnapshot ?? {};
  const snapshotFiles = Array.isArray(snapshot.files) ? snapshot.files : [];
  const publicLaunchLocales = Array.isArray(snapshot.publicLaunchLocales) ? snapshot.publicLaunchLocales : [];
  if (snapshot.algorithm !== "sha256") errors.push("The recap contract snapshot must use sha256.");
  if (publicLaunchLocales.length !== 1 || publicLaunchLocales[0] !== "en") {
    errors.push("The mobile public launch contract must remain English-only.");
  }
  const snapshotPaths = snapshotFiles.map((item) => item.path);
  if (
    snapshotFiles.length !== expectedContractFiles.length
    || new Set(snapshotPaths).size !== snapshotPaths.length
    || expectedContractFiles.some((file) => !snapshotPaths.includes(file))
  ) {
    errors.push("The football and basketball recap snapshot must contain all four unique contract files.");
  }
  for (const entry of snapshotFiles) {
    if (!expectedContractFiles.includes(entry.path)) continue;
    const absolutePath = path.join(root, entry.path);
    if (!fs.existsSync(absolutePath)) {
      errors.push(`Recorded recap contract file is missing: ${entry.path}`);
      continue;
    }
    const actualDigest = crypto.createHash("sha256").update(fs.readFileSync(absolutePath)).digest("hex");
    if (entry.sha256 !== actualDigest) errors.push(`Recap contract snapshot is stale or altered: ${entry.path}`);
  }

  const localeBoundary = record.localeBoundary ?? {};
  const boundaryPublicLocales = Array.isArray(localeBoundary.publicLaunchLocales) ? localeBoundary.publicLaunchLocales : [];
  const prototypeLocales = Array.isArray(localeBoundary.prototypeLocales) ? localeBoundary.prototypeLocales : [];
  if (boundaryPublicLocales.length !== 1 || boundaryPublicLocales[0] !== "en") {
    errors.push("The explicit locale boundary must keep English as the only public launch locale.");
  }
  if (prototypeLocales.length !== 1 || prototypeLocales[0] !== "he") {
    errors.push("Hebrew must remain the only recorded prototype locale.");
  }
  if (localeBoundary.publicSelectorEnabled !== false) {
    errors.push("Prototype locales must not be publicly selectable.");
  }
  if (
    localeBoundary.prototypeOptInEnvironmentVariable !== "EXPO_PUBLIC_ENABLE_HEBREW_PROTOTYPE"
    || localeBoundary.prototypeRequiresDevelopmentBuild !== true
  ) {
    errors.push("The Hebrew prototype must require both the explicit environment opt-in and a development build.");
  }
  for (const relativePath of localeBoundary.evidence ?? []) {
    if (!fs.existsSync(path.join(root, relativePath))) errors.push(`Recorded locale-boundary evidence is missing: ${relativePath}`);
  }
  const configRoute = fs.readFileSync(path.join(root, "app/api/v1/config/route.ts"), "utf8");
  const configSchema = fs.readFileSync(path.join(root, "packages/api-contracts/schemas/config.schema.json"), "utf8");
  const mobileLocale = fs.readFileSync(path.join(root, "prototypes/mobile/src/locale.tsx"), "utf8");
  const mobileHeader = fs.readFileSync(path.join(root, "prototypes/mobile/src/header.tsx"), "utf8");
  if (!configRoute.includes('publicLaunchLocales: active') || !configRoute.includes('prototypeLocalesPubliclySelectable: false')) {
    errors.push("The public config endpoint does not expose the required English-only locale boundary.");
  }
  if (!configSchema.includes('"publicLaunch"') || !configSchema.includes('"english-only"')) {
    errors.push("The config schema does not fail closed on the public English-only locale policy.");
  }
  if (!mobileLocale.includes('EXPO_PUBLIC_ENABLE_HEBREW_PROTOTYPE') || !mobileLocale.includes('__DEV__')) {
    errors.push("The Expo locale provider does not keep Hebrew behind the internal prototype guard.");
  }
  if (!mobileHeader.includes('canPreviewPrototypeLocale')) {
    errors.push("The Expo header does not hide the prototype selector behind the locale guard.");
  }

  const scenarios = Array.isArray(responsiveReport?.results) ? responsiveReport.results : [];
  if (scenarios.length !== 2 || scenarios.some((item) => item.status !== "pass" || item.noHorizontalOverflow !== true)) {
    errors.push("Both responsive mobile proxy scenarios must pass without horizontal overflow.");
  }
  if (errors.length === 0) {
    findings.push(`Responsive evidence is ${evidenceAgeHours.toFixed(1)} hours old and expires ${evidenceExpiresAt}.`);
    findings.push("Five release gates retain local, owner and store authority boundaries.");
    findings.push("Four football and basketball recap contract files match the recorded sha256 snapshot.");
    findings.push("The public mobile launch surface remains English-only while RTL capability stays dormant.");
    findings.push("Hebrew is explicitly prototype-only, hidden from public selectors and guarded by development opt-in.");
    findings.push("Native simulator acceptance remains explicitly blocked rather than inferred from web proof.");
  }

  return {
    valid: errors.length === 0,
    checkedAt: now.toISOString(),
    releaseGates: gates.length,
    contractFixtures: record.maintenanceReview?.articleDetailFixtures ?? null,
    contractSnapshotFiles: snapshotFiles.length,
    responsiveScenarios: scenarios.length,
    responsiveEvidenceAgeHours: Number.isFinite(evidenceAgeHours) ? Number(evidenceAgeHours.toFixed(1)) : null,
    responsiveEvidenceExpiresAt: evidenceExpiresAt,
    externalActionsRecorded: Array.isArray(record.externalActionsTaken) ? record.externalActionsTaken.length : null,
    findings,
    errors,
  };
}

export function validateMobileReleasePlan(root = defaultRoot, now = new Date()) {
  const record = JSON.parse(fs.readFileSync(path.join(root, "data/mobile-release-plan.json"), "utf8"));
  const responsiveReport = JSON.parse(fs.readFileSync(path.join(root, "outputs/mobile-qa/responsive-qa-report.json"), "utf8"));
  return validateMobileReleasePlanRecord(record, responsiveReport, now, root);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = validateMobileReleasePlan();
  console.log(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}
