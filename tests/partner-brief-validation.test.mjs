import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

import { buildPartnerBriefReadinessReport, validatePartnerBrief, validatePartnerBriefInputs } from "../scripts/validate-partner-brief.mjs";

const sourcePath = "docs/partner-one-page-brief.md";
const pdfPath = "output/pdf/ilsp-founding-partner-brief.pdf";
const inputs = {
  sourceText: fs.readFileSync(sourcePath, "utf8"),
  consistencyText: fs.readFileSync("docs/partner-brief-consistency-check.md", "utf8"),
  pdfBuffer: fs.readFileSync(pdfPath),
  sourceMtimeMs: fs.statSync(sourcePath).mtimeMs,
  consistencyMtimeMs: fs.statSync("docs/partner-brief-consistency-check.md").mtimeMs,
  pdfMtimeMs: fs.statSync(pdfPath).mtimeMs,
};

test("the current one-page partner brief and PDF pass the release preflight", () => {
  const validation = validatePartnerBrief();
  const report = buildPartnerBriefReadinessReport(validation, new Date("2026-07-17T08:45:00+03:00"));
  assert.equal(validation.valid, true, validation.errors.join("\n"));
  assert.equal(validation.pageCount, 1);
  assert.ok(validation.pdfBytes > 50_000);
  assert.equal(report.artifacts.renderedPdf.pages, 1);
  assert.equal(report.currentness.maxAgeDays, 31);
  assert.ok(report.currentness.expiresAt);
  assert.equal(report.controlledPosition.ownerApprovalRequired, true);
  assert.deepEqual(report.externalActionsTaken, []);
});

test("the partner brief preflight rejects a stale PDF or active Hebrew expansion", () => {
  const stale = validatePartnerBriefInputs({ ...inputs, sourceMtimeMs: inputs.pdfMtimeMs + 1 });
  assert.equal(stale.valid, false);
  assert.match(stale.errors.join("\n"), /PDF is older/);

  const languageDrift = validatePartnerBriefInputs({
    ...inputs,
    sourceText: inputs.sourceText.replace(
      "Hebrew translation is not part of the current roadmap",
      "Hebrew translation is part of the current roadmap",
    ),
  });
  assert.equal(languageDrift.valid, false);
  assert.match(languageDrift.errors.join("\n"), /Hebrew editorial expansion/);

  const staleEvidence = validatePartnerBriefInputs({
    ...inputs,
    nowMs: inputs.sourceMtimeMs + 32 * 86_400_000,
  });
  assert.equal(staleEvidence.valid, false);
  assert.match(staleEvidence.errors.join("\n"), /older than 31 days/);
});
