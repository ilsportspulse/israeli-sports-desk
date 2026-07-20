import assert from "node:assert/strict";
import test from "node:test";

import { validateSocialLaunch } from "../scripts/validate-social-launch.mjs";

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
  const afterSnapshotExpiry = Date.parse("2026-07-20T13:40:01Z");
  const result = validateSocialLaunch(undefined, afterSnapshotExpiry);
  assert.equal(result.snapshotExpired, true);
  assert.equal(result.valid, false);
  assert.match(result.errors.join("\n"), /expired and must be refreshed/);
});
