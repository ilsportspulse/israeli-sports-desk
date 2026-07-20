import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildPartnerReadinessReport, validatePartnerSubmissionInputs, validatePartnerSubmissionPack } from "../scripts/validate-partner-submissions.mjs";

const inputs = {
  decisionBrief: fs.readFileSync("docs/partner-owner-decision-brief.md", "utf8"),
  drafts: fs.readFileSync("docs/partner-first-two-submission-drafts.md", "utf8"),
  onePageBrief: fs.readFileSync("docs/partner-one-page-brief.md", "utf8"),
  consistencyCheck: fs.readFileSync("docs/partner-brief-consistency-check.md", "utf8"),
  prospects: JSON.parse(fs.readFileSync("data/partner-prospects.json", "utf8")),
};

test("the first two partner submission packs remain consistent and owner-gated", () => {
  const result = validatePartnerSubmissionPack();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.qualifiedRoutes, 2);
  assert.equal(result.heldRoutes, 3);
  assert.equal(result.hardStopPlaceholders, 7);
  assert.equal(result.pendingDecisionCells, 12);
});

test("the partner preflight rejects a removed placeholder or approval bypass", () => {
  const missingPlaceholder = { ...inputs, drafts: inputs.drafts.replace("[OWNER-APPROVED PRODUCTION URL]", "https://example.invalid") };
  assert.equal(validatePartnerSubmissionInputs(missingPlaceholder).valid, false);

  const bypassedProspects = structuredClone(inputs.prospects);
  bypassedProspects.find((prospect) => prospect.id === "aws-activate").ownerApprovalRequired = false;
  assert.equal(validatePartnerSubmissionInputs({ ...inputs, prospects: bypassedProspects }).valid, false);
});

test("the partner preflight fails closed when route evidence ages out", () => {
  const staleProspects = structuredClone(inputs.prospects);
  staleProspects.find((prospect) => prospect.id === "aws-activate").qualifiedAt = "2026-05-01";
  const result = validatePartnerSubmissionInputs({
    ...inputs,
    prospects: staleProspects,
    now: new Date("2026-07-17T07:35:00+03:00"),
  });
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /aws-activate qualification evidence must be dated within 31 days/);
});

test("the partner readiness artifact exposes every route and its evidence expiry", () => {
  const now = new Date("2026-07-17T08:20:00+03:00");
  const validation = validatePartnerSubmissionInputs({ ...inputs, now });
  const report = buildPartnerReadinessReport(inputs.prospects, validation, now);
  assert.equal(report.valid, true);
  assert.equal(report.routes.length, 5);
  assert.deepEqual(report.routes.map((route) => route.id), [
    "aws-activate",
    "maccabi-world-union",
    "bank-hapoalim",
    "bank-leumi",
    "yes-israel",
  ]);
  assert.ok(report.routes.every((route) => route.expiresAt && route.daysUntilExpiry > 0));
  assert.deepEqual(report.externalActionsTaken, []);
});
