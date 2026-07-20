import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validatePartnerIntakeMonitoring, validatePartnerIntakeMonitoringFiles } from "../scripts/validate-partner-intake-monitoring.mjs";

const monitoring = JSON.parse(fs.readFileSync("data/partner-intake-monitoring.json", "utf8"));
const prospects = JSON.parse(fs.readFileSync("data/partner-prospects.json", "utf8"));
const now = new Date("2026-07-17T11:05:00+03:00");

test("the held-partner monitor keeps three current, internal and owner-gated routes", () => {
  const result = validatePartnerIntakeMonitoringFiles(process.cwd(), now);
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.heldTargets, 3);
  assert.equal(result.externalActionsTaken, 0);
  assert.ok(result.earliestExpiryAt);
});

test("the held-partner monitor fails closed when evidence ages out", () => {
  const stale = structuredClone(monitoring);
  stale.targets.find((target) => target.id === "bank-hapoalim").lastCheckedAt = "2026-05-01T12:00:00+03:00";
  const result = validatePartnerIntakeMonitoring({ monitoring: stale, prospects, now });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /bank-hapoalim monitoring evidence must be within 31 days/);
});

test("the held-partner monitor rejects a false-route or authority bypass", () => {
  const bypass = structuredClone(monitoring);
  bypass.promotionRequiresOwnerApproval = false;
  bypass.targets.find((target) => target.id === "yes-israel").excludedRoutes = ["customer service"];
  const result = validatePartnerIntakeMonitoring({ monitoring: bypass, prospects, now });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /promotion must require owner approval/);
  assert.match(result.errors.join("\n"), /yes-israel must retain its known false-route exclusion/);
});
