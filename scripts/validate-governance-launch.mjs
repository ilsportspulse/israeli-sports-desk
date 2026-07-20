import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");

const expectedRoutes = ["/corrections", "/privacy", "/terms", "/commercial-independence"];
const expectedAddresses = [
  "corrections@ilsportspulse.com",
  "privacy@ilsportspulse.com",
  "legal@ilsportspulse.com",
  "partnerships@ilsportspulse.com",
];

function readInputs(root = defaultRoot) {
  const activation = JSON.parse(readFileSync(path.join(root, "data/governance-activation-status.json"), "utf8"));
  const browserReport = JSON.parse(readFileSync(path.join(root, "outputs/site-mobile-qa/report.json"), "utf8"));
  return {
    activation,
    browserReport,
    checklist: readFileSync(path.join(root, "docs/governance-launch-checklist.md"), "utf8"),
    newsroom: readFileSync(path.join(root, "components/newsroom.tsx"), "utf8"),
    governancePage: readFileSync(path.join(root, "components/governance-page.tsx"), "utf8"),
    policies: Object.fromEntries(
      activation.policyRoutes.map((entry) => [
        entry.route,
        readFileSync(path.join(root, entry.file), "utf8"),
      ]),
    ),
  };
}

export function validateGovernanceInputs(inputs) {
  const {
    activation,
    browserReport,
    checklist,
    newsroom,
    governancePage,
    policies,
    now = new Date(),
  } = inputs;
  const errors = [];
  const findings = [];

  const routes = Array.isArray(activation.policyRoutes) ? activation.policyRoutes : [];
  const routeNames = routes.map((entry) => entry.route);
  if (routes.length !== expectedRoutes.length || new Set(routeNames).size !== expectedRoutes.length || expectedRoutes.some((route) => !routeNames.includes(route))) {
    errors.push("The activation record must contain each of the four governance routes exactly once.");
  }

  for (const entry of routes) {
    if (entry.footerLinkVerified !== true || entry.responsiveSharedLayout !== true) {
      errors.push(`${entry.route} is missing its footer or shared-layout evidence.`);
    }
    if (!newsroom.includes(`href=\"${entry.route}\"`)) errors.push(`${entry.route} is absent from the permanent footer.`);
    if (!policies[entry.route]?.includes("<GovernancePage")) errors.push(`${entry.route} does not use the shared governance page.`);
    if (!governancePage.includes(`href: \"${entry.route}\"`)) errors.push(`${entry.route} is absent from the shared policy index.`);
  }
  if (routes.length === expectedRoutes.length && !errors.some((error) => error.includes("route") || error.includes("footer") || error.includes("shared"))) {
    findings.push("All four policy routes remain in the footer and shared responsive policy index.");
  }

  const addresses = Array.isArray(activation.publicAddresses) ? activation.publicAddresses : [];
  const addressValues = addresses.map((entry) => entry.address);
  if (addresses.length !== expectedAddresses.length || new Set(addressValues).size !== expectedAddresses.length || expectedAddresses.some((address) => !addressValues.includes(address))) {
    errors.push("The activation record must contain the four intended policy addresses exactly once.");
  }
  const policyCopy = Object.values(policies).join("\n");
  for (const entry of addresses) {
    if (entry.activationStatus !== "unverified-owner-controlled" || entry.ownerApprovalRequired !== true) {
      errors.push(`${entry.address} was treated as active without owner-controlled evidence.`);
    }
    if (!policyCopy.includes(entry.address)) errors.push(`${entry.address} is absent from the policy copy.`);
  }
  if (addresses.length === expectedAddresses.length && addresses.every((entry) => entry.activationStatus === "unverified-owner-controlled" && entry.ownerApprovalRequired === true)) {
    findings.push("All four public address references remain explicitly unverified and owner-gated.");
  }

  const prerequisites = Array.isArray(activation.launchPrerequisites) ? activation.launchPrerequisites : [];
  if (prerequisites.length !== 7 || prerequisites.some((entry) => !String(entry.status).startsWith("pending") || !entry.evidenceRequired?.trim())) {
    errors.push("All seven launch prerequisites must remain pending with explicit evidence requirements.");
  }
  if (!Array.isArray(activation.externalActionsTaken) || activation.externalActionsTaken.length !== 0) {
    errors.push("Governance maintenance must not record external actions before owner approval.");
  }
  if (!/release rule is fail-closed/i.test(checklist)) errors.push("The governance checklist has lost its fail-closed release rule.");
  if (!Array.isArray(activation.launchBlockers) || activation.launchBlockers.length < 4) errors.push("The release blocker record is incomplete.");

  const audit = activation.localAudit;
  const auditCheckedAt = Date.parse(audit?.checkedAt ?? "");
  const auditValidUntil = Date.parse(audit?.validUntil ?? "");
  const nowMs = now.getTime();
  if (!Number.isFinite(auditCheckedAt) || !Number.isFinite(auditValidUntil) || auditValidUntil <= auditCheckedAt) {
    errors.push("The local governance audit needs a valid checkedAt and later validUntil time.");
  } else if (nowMs > auditValidUntil) {
    errors.push("The local governance audit has expired and must be refreshed before release review.");
  }

  const browserCheckedAt = Date.parse(browserReport.checkedAt ?? "");
  const policyResults = Array.isArray(browserReport.results)
    ? browserReport.results.filter((result) => expectedRoutes.includes(result.path))
    : [];
  const policyScenarioKeys = new Set(policyResults.map((result) => `${result.path}:${result.width}`));
  const expectedScenarioKeys = expectedRoutes.flatMap((route) => [390, 1440].map((width) => `${route}:${width}`));
  if (!Number.isFinite(browserCheckedAt) || nowMs - browserCheckedAt > 24 * 60 * 60 * 1000) {
    errors.push("Governance browser evidence must be less than 24 hours old.");
  }
  if (policyResults.length !== 8 || expectedScenarioKeys.some((key) => !policyScenarioKeys.has(key))) {
    errors.push("Browser evidence must cover every governance route at 390px and 1440px exactly once.");
  }
  for (const result of policyResults) {
    if (result.statusCode !== 200 || result.noHorizontalOverflow !== true || result.stylesheetRuleCount <= 0 || result.localResourceFailures?.length) {
      errors.push(`${result.id} failed status, layout, stylesheet or local-resource acceptance.`);
    }
  }
  if (policyResults.length === 8 && policyResults.every((result) => result.statusCode === 200 && result.noHorizontalOverflow === true && result.stylesheetRuleCount > 0 && !result.localResourceFailures?.length)) {
    findings.push("Eight current governance browser scenarios pass at 390px and 1440px.");
  }

  return {
    valid: errors.length === 0,
    checkedAt: now.toISOString(),
    routesChecked: routes.length,
    addressesChecked: addresses.length,
    prerequisitesChecked: prerequisites.length,
    browserScenariosChecked: policyResults.length,
    externalActionsRecorded: Array.isArray(activation.externalActionsTaken) ? activation.externalActionsTaken.length : null,
    findings,
    errors,
  };
}

export function validateGovernanceLaunch(root = defaultRoot, now = new Date()) {
  return validateGovernanceInputs({ ...readInputs(root), now });
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = validateGovernanceLaunch();
  console.log(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}
