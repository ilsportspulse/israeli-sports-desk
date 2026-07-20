import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { validateBasketballRecap, validateContractFixtures, validateFootballRecap } from "../scripts/validate-api-contracts.mjs";

const footballFixture = JSON.parse(fs.readFileSync("packages/api-contracts/fixtures/article-detail.football.json", "utf8"));
const clubBasketballFixture = JSON.parse(fs.readFileSync("packages/api-contracts/fixtures/article-detail.basketball-club.json", "utf8"));

test("API detail fixtures pass the fail-closed recap validator", () => {
  assert.deepEqual(validateContractFixtures(), { fixtures: 3, footballLineups: [11, 11], basketballMarks: ["flag", "logo"], status: "passed" });
});

test("basketball recap validation accepts club logos and fails closed without an attendance representation", () => {
  assert.doesNotThrow(() => validateBasketballRecap(clubBasketballFixture.basketballRecap));

  const missingMark = structuredClone(clubBasketballFixture.basketballRecap);
  delete missingMark.home.logo;
  assert.throws(() => validateBasketballRecap(missingMark), /flag or logo/);

  const missingAttendance = structuredClone(clubBasketballFixture.basketballRecap);
  delete missingAttendance.attendanceNote;
  assert.throws(() => validateBasketballRecap(missingAttendance), /attendance or an explicit unavailable marker/);

  const malformedMark = structuredClone(clubBasketballFixture.basketballRecap);
  malformedMark.home.logo = "team-marks/rockets.svg";
  assert.throws(() => validateBasketballRecap(malformedMark), /absolute URL or local team-mark path/);
});

test("football recap validation rejects incomplete line-ups and unsupported events", () => {
  const shortLineup = structuredClone(footballFixture.matchRecap);
  shortLineup.home.lineup.pop();
  assert.throws(() => validateFootballRecap(shortLineup), /exactly 11 starters/);

  const unsupportedEvent = structuredClone(footballFixture.matchRecap);
  unsupportedEvent.events[0].type = "rumour";
  assert.throws(() => validateFootballRecap(unsupportedEvent), /unsupported/);
});

test("football recap validation accepts an explicit unavailable attendance marker and still fails closed without one", () => {
  const pendingAttendance = structuredClone(footballFixture.matchRecap);
  delete pendingAttendance.attendance;
  pendingAttendance.attendanceNote = "Not announced";
  assert.doesNotThrow(() => validateFootballRecap(pendingAttendance));

  delete pendingAttendance.attendanceNote;
  assert.throws(() => validateFootballRecap(pendingAttendance), /attendance or an explicit unavailable marker/);
});
