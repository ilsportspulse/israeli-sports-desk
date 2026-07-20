import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { validateSocialLaunch } from "../scripts/validate-social-launch.mjs";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

test("the fourteen-day social launch plan remains complete, local and owner-gated", () => {
  const result = validateSocialLaunch();
  assert.equal(result.valid, true, result.errors.join("\n"));
  assert.equal(result.daysChecked, 14);
  assert.equal(result.templatesChecked, 3);
  assert.equal(result.externalActionsRecorded, 0);
  assert.equal(result.currentStoryCandidates, 7);
  assert.equal(result.currentStoryMedia, 7);
  assert.equal(result.snapshotWindowHours, 12);
  assert.equal(result.snapshotExpired, false);
});

test("the social launch preflight fails closed after the current-story snapshot expires", () => {
  // Derive the probe from the live snapshot's own validUntil (+1s) rather than a
  // hardcoded date, so this fail-closed check stays correct as the snapshot is
  // refreshed instead of time-bombing the whole suite.
  const manifest = JSON.parse(readFileSync(path.join(repoRoot, "data/social-launch-manifest.json"), "utf8"));
  const afterSnapshotExpiry = Date.parse(manifest.currentStorySnapshot.validUntil) + 1000;
  const result = validateSocialLaunch(undefined, afterSnapshotExpiry);
  assert.equal(result.snapshotExpired, true);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /expired and must be refreshed/);
});
