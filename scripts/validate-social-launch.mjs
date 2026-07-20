import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const defaultRoot = path.resolve(path.dirname(scriptPath), "..");

export function validateSocialLaunch(root = defaultRoot, now = Date.now()) {
  const manifestPath = path.join(root, "data/social-launch-manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const articles = JSON.parse(readFileSync(path.join(root, "data/articles.json"), "utf8"));
  const articleMedia = JSON.parse(readFileSync(path.join(root, "data/article-media.json"), "utf8"));
  const errors = [];
  const findings = [];

  if (manifest.visibility !== "internal") errors.push("Manifest visibility must remain internal.");
  if (manifest.launchDate !== null) errors.push("Launch date must remain unset until owner approval.");
  if (!Array.isArray(manifest.externalActionsTaken) || manifest.externalActionsTaken.length !== 0) {
    errors.push("External actions must remain empty before owner approval.");
  }

  const days = Array.isArray(manifest.days) ? manifest.days : [];
  const dayNumbers = days.map((entry) => entry.day);
  const expectedDays = Array.from({ length: 14 }, (_, index) => index + 1);
  if (days.length !== 14 || new Set(dayNumbers).size !== 14 || expectedDays.some((day) => !dayNumbers.includes(day))) {
    errors.push("Manifest must contain each day from 1 through 14 exactly once.");
  } else {
    findings.push("Days 1 through 14 are present exactly once.");
  }

  const templates = manifest.templates && typeof manifest.templates === "object" ? manifest.templates : {};
  const templateKeys = Object.keys(templates);
  if (templateKeys.length !== 3) errors.push("Exactly three reusable master templates are required.");
  for (const [key, relativePath] of Object.entries(templates)) {
    const absolutePath = path.join(root, relativePath);
    if (!existsSync(absolutePath)) {
      errors.push(`Template ${key} is missing at ${relativePath}.`);
      continue;
    }
    const source = readFileSync(absolutePath, "utf8");
    if (!source.includes("<svg")) errors.push(`Template ${key} is not an SVG master.`);
  }
  if (templateKeys.length === 3 && templateKeys.every((key) => existsSync(path.join(root, templates[key])))) {
    findings.push("All three reusable SVG masters exist.");
  }

  for (const entry of days) {
    if (!templates[entry.primaryTemplate]) errors.push(`Day ${entry.day} has an unknown primary template.`);
    if (!templates[entry.secondaryTemplate]) errors.push(`Day ${entry.day} has an unknown secondary template.`);
    if (entry.primaryTemplate === entry.secondaryTemplate) errors.push(`Day ${entry.day} repeats the same template twice.`);
    if (!entry.lead?.trim() || !entry.support?.trim() || !entry.requiredInput?.trim()) {
      errors.push(`Day ${entry.day} is missing lead, support or required-input copy.`);
    }
    if (!String(entry.status).includes("ready")) errors.push(`Day ${entry.day} is not marked ready.`);
  }
  if (days.length === 14 && days.every((entry) => templates[entry.primaryTemplate] && templates[entry.secondaryTemplate])) {
    findings.push("Every day resolves both template references.");
  }

  if (!String(manifest.languagePositioning).toLowerCase().includes("english-only")) {
    errors.push("The approved English-only launch position is missing.");
  } else {
    findings.push("English-only launch positioning is explicit.");
  }

  if (!Array.isArray(manifest.ownerGates) || manifest.ownerGates.length < 4) {
    errors.push("Account, launch-date, public-route and posting approvals must remain owner gates.");
  } else {
    findings.push(`${manifest.ownerGates.length} owner gates remain active.`);
  }

  const serializedDays = JSON.stringify(days);
  if (/https?:\/\/(?:localhost|127\.0\.0\.1)/i.test(serializedDays)) {
    errors.push("A local preview URL must never appear in the launch manifest.");
  }

  const snapshot = manifest.currentStorySnapshot && typeof manifest.currentStorySnapshot === "object"
    ? manifest.currentStorySnapshot
    : null;
  const candidates = Array.isArray(snapshot?.candidates) ? snapshot.candidates : [];
  const requiredRoles = ["match-centre", "israelis-abroad", "youth", "israeli-football", "column", "archive", "major-international"];
  const candidateRoles = new Set(candidates.map((candidate) => candidate.role));
  const candidateIds = candidates.map((candidate) => candidate.articleId);
  const snapshotAt = Date.parse(snapshot?.checkedAt ?? "");
  const validUntil = Date.parse(snapshot?.validUntil ?? "");
  const snapshotWindowHours = Number.isFinite(snapshotAt) && Number.isFinite(validUntil)
    ? (validUntil - snapshotAt) / (60 * 60 * 1000)
    : null;

  if (!snapshot || !Number.isFinite(snapshotAt) || !Number.isFinite(validUntil) || validUntil <= snapshotAt) {
    errors.push("The current-story snapshot must carry a valid checkedAt and later validUntil time.");
  }
  if (Number.isFinite(snapshotWindowHours) && snapshotWindowHours > 12) {
    errors.push("The current-story snapshot may not remain valid for more than 12 hours.");
  }
  if (snapshot?.status !== "internal-candidates-only-not-scheduled") {
    errors.push("Current-story candidates must remain explicitly internal and unscheduled.");
  }
  if (requiredRoles.some((role) => !candidateRoles.has(role))) {
    errors.push("The current-story snapshot is missing one or more required editorial roles.");
  }
  if (new Set(candidateIds).size !== candidateIds.length) {
    errors.push("Current-story candidates must use distinct articles so the launch sequence is not padded with repeats.");
  }

  const articleById = new Map(articles.map((article) => [article.id, article]));
  const candidateMediaPaths = [];
  for (const candidate of candidates) {
    const article = articleById.get(candidate.articleId);
    if (!article || article.status !== "published") {
      errors.push(`Current-story role ${candidate.role} does not resolve to a published article.`);
      continue;
    }
    const publishedAt = Date.parse(article.publishedAt);
    const maxAgeHours = Number(candidate.maxAgeHours);
    if (!Number.isFinite(publishedAt) || !Number.isFinite(maxAgeHours) || maxAgeHours <= 0 || snapshotAt - publishedAt > maxAgeHours * 60 * 60 * 1000) {
      errors.push(`Current-story role ${candidate.role} is older than its declared freshness window.`);
    }

    const requirements = Array.isArray(candidate.requires) ? candidate.requires : [];
    if (requirements.includes("matchRecap") && !article.matchRecap) errors.push(`Current-story role ${candidate.role} requires a football match centre.`);
    if (requirements.includes("basketballRecap") && !article.basketballRecap) errors.push(`Current-story role ${candidate.role} requires a basketball game centre.`);
    if (requirements.includes("column") && !(article.kind === "analysis" && article.storyForm === "column")) errors.push(`Current-story role ${candidate.role} is not a published column.`);
    if (requirements.includes("historical-feature") && article.storyForm !== "historical-feature") errors.push(`Current-story role ${candidate.role} is not a historical feature.`);

    const media = articleMedia[article.id];
    if (!media?.src || !media.caption?.trim() || !media.credit?.trim() || !media.license?.trim()) {
      errors.push(`Current-story role ${candidate.role} has incomplete media provenance.`);
      continue;
    }
    if (!media.src.startsWith("/media/") || !existsSync(path.join(root, "public", media.src))) {
      errors.push(`Current-story role ${candidate.role} has no local publishable media file.`);
      continue;
    }
    candidateMediaPaths.push(media.src);
  }
  if (candidateMediaPaths.length === candidates.length && new Set(candidateMediaPaths).size === candidateMediaPaths.length) {
    findings.push(`${candidates.length} current published candidates resolve to distinct credited media files.`);
  } else if (candidateMediaPaths.length === candidates.length) {
    errors.push("Current-story candidates must not reuse the same local media file.");
  }

  const snapshotExpired = Number.isFinite(validUntil) && now > validUntil;
  if (snapshotExpired) {
    errors.push("The internal current-story snapshot has expired and must be refreshed before any owner-approved scheduling batch.");
  } else if (Number.isFinite(validUntil)) {
    findings.push(`The internal current-story snapshot remains valid until ${snapshot.validUntil}.`);
  }

  return {
    valid: errors.length === 0,
    checkedAt: new Date().toISOString(),
    daysChecked: days.length,
    templatesChecked: templateKeys.length,
    externalActionsRecorded: Array.isArray(manifest.externalActionsTaken) ? manifest.externalActionsTaken.length : null,
    currentStoryCandidates: candidates.length,
    currentStoryMedia: candidateMediaPaths.length,
    snapshotWindowHours,
    snapshotExpired,
    findings,
    errors,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === scriptPath) {
  const result = validateSocialLaunch();
  console.log(JSON.stringify(result));
  if (!result.valid) process.exitCode = 1;
}
