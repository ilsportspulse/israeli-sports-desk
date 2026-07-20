import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");
const heldTargetIds = ["bank-hapoalim", "bank-leumi", "yes-israel"];
const requiredExcludedRoute = {
  "bank-hapoalim": "customer service",
  "bank-leumi": "donations committee",
  "yes-israel": "supplier login",
};

function ageDays(value, now) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return (now.getTime() - timestamp) / 86_400_000;
}

export function validatePartnerIntakeMonitoring({ monitoring, prospects, now = new Date() }) {
  const errors = [];
  const ages = [];
  const maxAgeDays = monitoring.maxEvidenceAgeDays;

  if (monitoring.visibility !== "internal") errors.push("Held-route monitoring must remain internal.");
  if (monitoring.cadence !== "monthly-or-on-official-material-change") errors.push("Held-route monitoring cadence has drifted.");
  if (!Number.isInteger(maxAgeDays) || maxAgeDays !== 31) errors.push("Held-route evidence must retain the 31-day freshness limit.");
  if (monitoring.promotionRequiresOwnerApproval !== true) errors.push("Held-route promotion must require owner approval.");
  if (!Array.isArray(monitoring.externalActionsTaken) || monitoring.externalActionsTaken.length !== 0) errors.push("Monitoring must not record an external action.");

  const targetIds = monitoring.targets?.map((target) => target.id) ?? [];
  if (targetIds.length !== heldTargetIds.length || new Set(targetIds).size !== heldTargetIds.length || heldTargetIds.some((id) => !targetIds.includes(id))) {
    errors.push("Monitoring must contain exactly the three approved held targets.");
  }

  const prospectById = new Map(prospects.map((prospect) => [prospect.id, prospect]));
  for (const id of heldTargetIds) {
    const target = monitoring.targets?.find((candidate) => candidate.id === id);
    const prospect = prospectById.get(id);
    if (!target) continue;
    if (!target.status?.startsWith("hold-") || target.status !== prospect?.status) errors.push(`${id} monitoring status must match the held prospect.`);
    if (prospect?.ownerApprovalRequired !== true) errors.push(`${id} prospect must retain owner approval.`);
    if (!target.qualifyingSignal?.trim()) errors.push(`${id} must define a positive promotion signal.`);
    if (!Array.isArray(target.officialUrls) || target.officialUrls.length < 2 || target.officialUrls.some((url) => !url.startsWith("https://"))) {
      errors.push(`${id} must retain at least two official HTTPS evidence URLs.`);
    }
    if (!Array.isArray(target.excludedRoutes) || !target.excludedRoutes.includes(requiredExcludedRoute[id])) {
      errors.push(`${id} must retain its known false-route exclusion.`);
    }
    const targetAge = ageDays(target.lastCheckedAt, now);
    const prospectAge = ageDays(prospect?.routeResearchedAt, now);
    if (targetAge === null || targetAge < -1 || targetAge > maxAgeDays) errors.push(`${id} monitoring evidence must be within ${maxAgeDays} days.`);
    else ages.push(targetAge);
    if (prospectAge === null || Math.abs(prospectAge - targetAge) > 0.01) errors.push(`${id} monitoring and prospect evidence dates must match.`);
  }

  const oldestAge = ages.length ? Math.max(...ages) : null;
  return {
    valid: errors.length === 0,
    heldTargets: heldTargetIds.length,
    maxEvidenceAgeDays: maxAgeDays,
    oldestEvidenceAgeDays: oldestAge === null ? null : Number(oldestAge.toFixed(1)),
    earliestExpiryAt: monitoring.targets?.length
      ? new Date(Math.min(...monitoring.targets.map((target) => Date.parse(target.lastCheckedAt) + maxAgeDays * 86_400_000))).toISOString()
      : null,
    externalActionsTaken: monitoring.externalActionsTaken?.length ?? null,
    errors,
  };
}

export function validatePartnerIntakeMonitoringFiles(root = defaultRoot, now = new Date()) {
  return validatePartnerIntakeMonitoring({
    monitoring: JSON.parse(readFileSync(path.join(root, "data/partner-intake-monitoring.json"), "utf8")),
    prospects: JSON.parse(readFileSync(path.join(root, "data/partner-prospects.json"), "utf8")),
    now,
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const now = new Date();
  const result = validatePartnerIntakeMonitoringFiles(defaultRoot, now);
  const file = path.join(defaultRoot, "data/partner-intake-monitoring.json");
  const monitoring = JSON.parse(readFileSync(file, "utf8"));
  monitoring.updatedAt = now.toISOString();
  monitoring.status = result.valid ? "fail-closed-currentness-preflight-passed" : "preflight-failed";
  monitoring.maintenanceReview = {
    checkedAt: now.toISOString(),
    valid: result.valid,
    heldTargets: result.heldTargets,
    oldestEvidenceAgeDays: result.oldestEvidenceAgeDays,
    earliestExpiryAt: result.earliestExpiryAt,
    errors: result.errors,
  };
  writeFileSync(file, `${JSON.stringify(monitoring, null, 2)}\n`);
  console.log(JSON.stringify({ checkedAt: now.toISOString(), report: "data/partner-intake-monitoring.json", ...result }));
  if (!result.valid) process.exitCode = 1;
}
