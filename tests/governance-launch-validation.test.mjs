import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateGovernanceInputs, validateGovernanceLaunch } from "../scripts/validate-governance-launch.mjs";

function loadInputs() {
  const activation = JSON.parse(fs.readFileSync("data/governance-activation-status.json", "utf8"));
  return {
    activation,
    browserReport: JSON.parse(fs.readFileSync("outputs/site-mobile-qa/report.json", "utf8")),
    checklist: fs.readFileSync("docs/governance-launch-checklist.md", "utf8"),
    newsroom: fs.readFileSync("components/newsroom.tsx", "utf8"),
    governancePage: fs.readFileSync("components/governance-page.tsx", "utf8"),
    policies: Object.fromEntries(activation.policyRoutes.map((entry) => [entry.route, fs.readFileSync(entry.file, "utf8")])),
    now: new Date("2026-07-19T10:35:00+03:00"),
  };
}

test("governance surfaces remain current, responsive and fail-closed", () => {
  const result = validateGovernanceLaunch(undefined, new Date("2026-07-19T10:35:00+03:00"));
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.routesChecked, 4);
  assert.equal(result.addressesChecked, 4);
  assert.equal(result.prerequisitesChecked, 7);
  assert.equal(result.browserScenariosChecked, 8);
  assert.equal(result.externalActionsRecorded, 0);
});

test("governance validation rejects an inbox activated without owner evidence", () => {
  const inputs = loadInputs();
  inputs.activation.publicAddresses[0].activationStatus = "active";
  const result = validateGovernanceInputs(inputs);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /treated as active without owner-controlled evidence/);
});

test("governance validation rejects stale responsive evidence", () => {
  const inputs = loadInputs();
  inputs.now = new Date("2026-07-21T09:40:00+03:00");
  inputs.activation.localAudit.validUntil = "2026-07-22T09:40:00+03:00";
  const result = validateGovernanceInputs(inputs);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /browser evidence must be less than 24 hours old/);
});
