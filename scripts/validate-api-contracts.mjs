import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const eventTypes = new Set(["goal", "yellow", "second-yellow", "red", "var"]);

function requiredString(value, label) {
  assert.equal(typeof value, "string", `${label} must be a string`);
  assert.ok(value.trim(), `${label} must not be empty`);
}

function validDateTime(value, label) {
  requiredString(value, label);
  assert.ok(Number.isFinite(Date.parse(value)), `${label} must be a valid date-time`);
}

function validateTeamMark(value, label) {
  requiredString(value, label);
  if (value.startsWith("/media/team-marks/")) return;
  assert.doesNotThrow(() => new URL(value), `${label} must be an absolute URL or local team-mark path`);
}

function validateMedia(media) {
  assert.ok(media && typeof media === "object", "media is required");
  assert.match(media.src, /^\/media\//, "media.src must use the local public media path");
  for (const field of ["alt", "caption", "credit", "license"]) requiredString(media[field], `media.${field}`);
  for (const field of ["creditUrl", "licenseUrl"]) assert.doesNotThrow(() => new URL(media[field]), `media.${field} must be an absolute URL`);
}

function validateTeam(team, label) {
  assert.ok(team && typeof team === "object", `${label} is required`);
  for (const field of ["name", "shortName", "coach"]) requiredString(team[field], `${label}.${field}`);
  assert.ok(Number.isInteger(team.score) && team.score >= 0, `${label}.score must be a non-negative integer`);
  if (team.logo !== undefined) validateTeamMark(team.logo, `${label}.logo`);
  assert.equal(team.lineup?.length, 11, `${label}.lineup must contain exactly 11 starters`);
  team.lineup.forEach((player, index) => requiredString(player, `${label}.lineup[${index}]`));
  assert.equal(new Set(team.lineup).size, 11, `${label}.lineup must not repeat a player`);
}

export function validateFootballRecap(recap) {
  assert.ok(recap && typeof recap === "object", "matchRecap is required");
  requiredString(recap.competition, "matchRecap.competition");
  assert.equal(recap.status, "FT", "matchRecap.status must be FT");
  validDateTime(recap.kickoff, "matchRecap.kickoff");
  for (const field of ["venue", "city", "referee"]) requiredString(recap[field], `matchRecap.${field}`);
  assert.ok(
    (Number.isInteger(recap.attendance) && recap.attendance > 0) || (typeof recap.attendanceNote === "string" && recap.attendanceNote.trim()),
    "matchRecap must provide attendance or an explicit unavailable marker",
  );
  validateTeam(recap.home, "matchRecap.home");
  validateTeam(recap.away, "matchRecap.away");
  assert.ok(Array.isArray(recap.events) && recap.events.length > 0, "matchRecap.events must not be empty");
  recap.events.forEach((event, index) => {
    const label = `matchRecap.events[${index}]`;
    for (const field of ["minute", "team", "player"]) requiredString(event[field], `${label}.${field}`);
    assert.ok(eventTypes.has(event.type), `${label}.type is unsupported`);
    if (event.detail !== undefined) requiredString(event.detail, `${label}.detail`);
    if (event.score !== undefined) assert.match(event.score, /^\d+\s*[–-]\s*\d+$/, `${label}.score must be a scoreline`);
  });
}

export function validateBasketballRecap(recap) {
  assert.ok(recap && typeof recap === "object", "basketballRecap is required");
  requiredString(recap.competition, "basketballRecap.competition");
  assert.equal(recap.status, "FT", "basketballRecap.status must be FT");
  validDateTime(recap.tipoff, "basketballRecap.tipoff");
  for (const field of ["venue", "city"]) requiredString(recap[field], `basketballRecap.${field}`);
  assert.ok(
    (Number.isInteger(recap.attendance) && recap.attendance > 0) || (typeof recap.attendanceNote === "string" && recap.attendanceNote.trim()),
    "basketballRecap must provide attendance or an explicit unavailable marker",
  );
  assert.ok(recap.officials?.length >= 2, "basketballRecap.officials must contain at least two officials");
  recap.officials.forEach((official, index) => requiredString(official, `basketballRecap.officials[${index}]`));
  for (const side of ["home", "away"]) {
    const team = recap[side];
    for (const field of ["name", "shortName"]) requiredString(team[field], `basketballRecap.${side}.${field}`);
    assert.ok(team.flag || team.logo, `basketballRecap.${side} must provide a flag or logo`);
    if (team.flag !== undefined) requiredString(team.flag, `basketballRecap.${side}.flag`);
    if (team.logo !== undefined) validateTeamMark(team.logo, `basketballRecap.${side}.logo`);
    assert.equal(team.quarters?.length, 4, `basketballRecap.${side}.quarters must contain four periods`);
    assert.equal(team.quarters.reduce((total, score) => total + score, 0), team.score, `basketballRecap.${side} quarter totals must equal the final score`);
  }
  assert.ok(recap.stats?.length >= 4, "basketballRecap.stats must contain at least four comparisons");
  assert.ok(recap.leaders?.length >= 2, "basketballRecap.leaders must contain at least two entries");
}

export function validateArticleDetail(article) {
  assert.equal(article.schemaVersion, "1.0", "schemaVersion must be 1.0");
  for (const field of ["id", "slug", "locale", "status", "title", "dek", "category", "kind"]) requiredString(article[field], field);
  assert.equal(article.status, "published", "status must be published");
  assert.match(article.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, "slug is invalid");
  validDateTime(article.publishedAt, "publishedAt");
  assert.ok(Number.isInteger(article.readMinutes) && article.readMinutes > 0, "readMinutes must be a positive integer");
  validateMedia(article.media);
  assert.ok(Array.isArray(article.body) && article.body.length > 0, "body must not be empty");
  assert.ok(Array.isArray(article.facts) && article.facts.length >= 4, "facts must contain at least four confirmed facts");
  if (article.matchRecap) validateFootballRecap(article.matchRecap);
  if (article.basketballRecap) validateBasketballRecap(article.basketballRecap);
}

export function validateContractFixtures(base = root) {
  const fixturePaths = [
    "packages/api-contracts/fixtures/article-detail.football.json",
    "packages/api-contracts/fixtures/article-detail.basketball.json",
    "packages/api-contracts/fixtures/article-detail.basketball-club.json",
  ];
  for (const fixturePath of fixturePaths) {
    validateArticleDetail(JSON.parse(fs.readFileSync(path.join(base, fixturePath), "utf8")));
  }
  return { fixtures: fixturePaths.length, footballLineups: [11, 11], basketballMarks: ["flag", "logo"], status: "passed" };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(JSON.stringify(validateContractFixtures()));
}
