import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateScoreProviderCoverage, validateScoreProviderRecord } from "../scripts/validate-score-provider-coverage.mjs";

test("score-provider coverage remains complete, rights-aware and owner-gated", () => {
  const result = validateScoreProviderCoverage();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.providersChecked, 6);
  assert.equal(result.sportRowsChecked, 17);
  assert.equal(result.acceptanceChecks, 13);
  assert.equal(result.footballRecapRequirements, 12);
  assert.equal(result.researchLinks, 15);
  assert.ok(result.claimAgeDays >= 0 && result.claimAgeDays < 31);
  assert.ok(result.claimEvidenceExpiresAt);
  assert.equal(result.externalActionsRecorded, 0);
});

test("score-provider coverage fails closed when planning claims age out", () => {
  const record = JSON.parse(fs.readFileSync("data/score-provider-coverage.json", "utf8"));
  record.claimFreshness.providerClaimsLastVerifiedAt = "2026-05-01T00:00:00Z";
  const result = validateScoreProviderRecord(record, new Date("2026-07-17T10:20:00+03:00"));
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /older than 31 days/);
});
