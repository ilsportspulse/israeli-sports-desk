import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateMobileReleasePlan, validateMobileReleasePlanRecord } from "../scripts/validate-mobile-release-plan.mjs";

const record = JSON.parse(fs.readFileSync("data/mobile-release-plan.json", "utf8"));
const responsiveReport = JSON.parse(fs.readFileSync("outputs/mobile-qa/responsive-qa-report.json", "utf8"));

test("mobile release evidence remains current, complete and authority-gated", () => {
  const result = validateMobileReleasePlan(process.cwd(), new Date("2026-07-20T07:35:00Z"));
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.releaseGates, 5);
  assert.equal(result.contractFixtures, 3);
  assert.equal(result.contractSnapshotFiles, 4);
  assert.equal(result.responsiveScenarios, 2);
  assert.equal(result.externalActionsRecorded, 0);
});

test("mobile release evidence fails closed after the responsive proof expires", () => {
  const result = validateMobileReleasePlanRecord(record, responsiveReport, new Date("2026-07-21T07:27:00Z"), process.cwd());
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /older than 24 hours/);
});

test("mobile release evidence rejects a store-path approval bypass", () => {
  const bypassed = structuredClone(record);
  const privateBeta = bypassed.releaseGates.find((gate) => gate.id === "private-beta");
  privateBeta.status = "ready";
  privateBeta.externalApprovalRequired = false;
  const result = validateMobileReleasePlanRecord(bypassed, responsiveReport, new Date("2026-07-17T07:55:00Z"), process.cwd());
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /private-beta must remain gated/);
});

test("mobile release evidence rejects an altered recap contract snapshot", () => {
  const altered = structuredClone(record);
  altered.contractSnapshot.files[0].sha256 = "0".repeat(64);
  const result = validateMobileReleasePlanRecord(altered, responsiveReport, new Date("2026-07-17T09:50:00Z"), process.cwd());
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /snapshot is stale or altered/);
});

test("mobile release evidence rejects a premature non-English public launch", () => {
  const expanded = structuredClone(record);
  expanded.contractSnapshot.publicLaunchLocales.push("he");
  const result = validateMobileReleasePlanRecord(expanded, responsiveReport, new Date("2026-07-17T09:50:00Z"), process.cwd());
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /public launch contract must remain English-only/);
});

test("mobile release evidence rejects a publicly selectable Hebrew prototype", () => {
  const exposed = structuredClone(record);
  exposed.localeBoundary.publicSelectorEnabled = true;
  const result = validateMobileReleasePlanRecord(exposed, responsiveReport, new Date("2026-07-17T10:33:00Z"), process.cwd());
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /must not be publicly selectable/);
});
