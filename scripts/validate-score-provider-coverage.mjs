import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");

export function validateScoreProviderRecord(record, now = new Date()) {
  const errors = [];
  const findings = [];

  if (record.visibility !== "internal") errors.push("Score-provider planning must remain internal.");
  if (!Array.isArray(record.externalActionsTaken) || record.externalActionsTaken.length !== 0) {
    errors.push("External actions must remain empty until owner approval.");
  }

  const claimFreshness = record.claimFreshness ?? {};
  const claimsVerifiedAt = Date.parse(claimFreshness.providerClaimsLastVerifiedAt ?? "");
  const maxClaimAgeDays = Number(claimFreshness.maxClaimAgeDays);
  const claimAgeDays = Number.isFinite(claimsVerifiedAt)
    ? (now.getTime() - claimsVerifiedAt) / (24 * 60 * 60 * 1000)
    : Number.NaN;
  const claimEvidenceExpiresAt = Number.isFinite(claimsVerifiedAt) && Number.isFinite(maxClaimAgeDays)
    ? new Date(claimsVerifiedAt + maxClaimAgeDays * 24 * 60 * 60 * 1000).toISOString()
    : null;
  if (!Number.isFinite(claimAgeDays) || !Number.isFinite(maxClaimAgeDays) || maxClaimAgeDays <= 0) {
    errors.push("Provider claim evidence needs a valid verification time and positive maximum age.");
  } else if (claimAgeDays < -0.05) {
    errors.push("Provider claim evidence cannot be dated in the future.");
  } else if (claimAgeDays > maxClaimAgeDays) {
    errors.push(`Provider claim evidence is older than ${maxClaimAgeDays} days and must be refreshed before trial review.`);
  } else {
    findings.push(`Provider claim evidence is ${claimAgeDays.toFixed(1)} days old and expires ${claimEvidenceExpiresAt}.`);
  }

  const providers = Array.isArray(record.providers) ? record.providers : [];
  const providerIds = providers.map((provider) => provider.id);
  if (providers.length !== 6 || new Set(providerIds).size !== providers.length) {
    errors.push("Six uniquely identified provider positions are required.");
  }
  for (const provider of providers) {
    if (!provider.status || !Array.isArray(provider.sports) || provider.sports.length === 0) {
      errors.push(`Provider ${provider.id ?? "unknown"} is missing status or sport scope.`);
    }
    if (!provider.rightsRisk?.trim() || !provider.recommendedRole?.trim()) {
      errors.push(`Provider ${provider.id ?? "unknown"} is missing rights risk or recommended role.`);
    }
    if (/approved-production|production-approved/i.test(provider.status)) {
      errors.push(`Provider ${provider.id} is prematurely marked production-approved.`);
    }
    if (!provider.publicPrice?.currency) errors.push(`Provider ${provider.id ?? "unknown"} has no price-status currency marker.`);
  }
  if (providers.length === 6 && providers.every((provider) => provider.rightsRisk && provider.recommendedRole)) {
    findings.push("Six provider positions retain rights risks and bounded roles.");
  }

  const sports = Array.isArray(record.sports) ? record.sports : [];
  const sportIds = sports.map((sport) => sport.id);
  if (sports.length !== 17 || new Set(sportIds).size !== sports.length) {
    errors.push("Seventeen uniquely identified sport or athlete-system rows are required.");
  }
  for (const sport of sports) {
    if (!sport.launchState?.trim()) errors.push(`Sport row ${sport.id ?? "unknown"} has no launch state.`);
    if (!Array.isArray(sport.fallback) || sport.fallback.length === 0) errors.push(`Sport row ${sport.id ?? "unknown"} has no authoritative fallback.`);
    if (!Array.isArray(sport.mustCover) || sport.mustCover.length === 0) errors.push(`Sport row ${sport.id ?? "unknown"} has no minimum coverage list.`);
    if (/live-approved|production-live/i.test(sport.launchState)) errors.push(`Sport row ${sport.id} is prematurely marked live-approved.`);
  }
  if (sports.length === 17 && sports.every((sport) => sport.fallback?.length && sport.mustCover?.length)) {
    findings.push("All seventeen sport rows retain required coverage and authoritative fallbacks.");
  }

  const acceptanceTests = Array.isArray(record.acceptanceTests) ? record.acceptanceTests : [];
  if (acceptanceTests.length !== 13 || new Set(acceptanceTests).size !== acceptanceTests.length) {
    errors.push("The thirteen acceptance checks must remain complete and unique.");
  }
  const acceptanceText = acceptanceTests.join(" ").toLowerCase();
  for (const concept of ["competition", "jerusalem", "line-ups", "women", "display rights", "retention", "parallel run"]) {
    if (!acceptanceText.includes(concept)) errors.push(`Acceptance suite is missing ${concept}.`);
  }
  if (acceptanceTests.length === 13) findings.push("Thirteen pre-purchase acceptance checks are present.");

  const recapRequirements = Array.isArray(record.footballRecapRequirements) ? record.footballRecapRequirements : [];
  if (recapRequirements.length !== 12 || new Set(recapRequirements).size !== recapRequirements.length) {
    errors.push("Twelve unique football recap data requirements are required.");
  }
  const recapText = recapRequirements.join(" ").toLowerCase();
  for (const concept of ["final score", "licensed marks", "attendance", "referee", "eleven-player", "goal scorers", "red cards", "substitutions", "shots on target", "var", "verification urls", "last-confirmed"]) {
    if (!recapText.includes(concept)) errors.push(`Football recap data gate is missing ${concept}.`);
  }
  if (recapRequirements.length === 12) findings.push("Twelve football match-report completeness requirements are present.");

  const sources = Array.isArray(record.sources) ? record.sources : [];
  if (sources.length !== 15 || new Set(sources).size !== sources.length || sources.some((url) => !url.startsWith("https://"))) {
    errors.push("Fifteen unique HTTPS research links are required.");
  } else {
    findings.push("Fifteen unique HTTPS research links are retained.");
  }

  const maintenance = record.maintenanceReview ?? {};
  if (maintenance.providerRows !== providers.length || maintenance.sportRows !== sports.length || maintenance.acceptanceChecks !== acceptanceTests.length) {
    errors.push("Maintenance row counts do not match the live matrix.");
  }
  if (maintenance.footballRecapRequirements !== recapRequirements.length) {
    errors.push("Maintenance recap-requirement count does not match the live matrix.");
  }
  for (const flag of ["trialsOpened", "accountsCreated", "purchasesMade", "externalContactsMade"]) {
    if (maintenance[flag] !== false) errors.push(`${flag} must remain false before owner approval.`);
  }
  if (!/after owner approval/i.test(record.recommendedNextAction ?? "")) errors.push("The recommended next action must retain explicit owner approval.");

  return {
    valid: errors.length === 0,
    checkedAt: now.toISOString(),
    providersChecked: providers.length,
    sportRowsChecked: sports.length,
    acceptanceChecks: acceptanceTests.length,
    footballRecapRequirements: recapRequirements.length,
    researchLinks: sources.length,
    claimAgeDays: Number.isFinite(claimAgeDays) ? Number(claimAgeDays.toFixed(1)) : null,
    claimEvidenceExpiresAt,
    externalActionsRecorded: Array.isArray(record.externalActionsTaken) ? record.externalActionsTaken.length : null,
    findings,
    errors,
  };
}

export function validateScoreProviderCoverage(root = defaultRoot, now = new Date()) {
  const record = JSON.parse(readFileSync(path.join(root, "data/score-provider-coverage.json"), "utf8"));
  return validateScoreProviderRecord(record, now);
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = validateScoreProviderCoverage();
  console.log(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}
