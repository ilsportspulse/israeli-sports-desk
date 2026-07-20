import type { Metadata } from "next";

import { GovernancePage } from "@/components/governance-page";

export const metadata: Metadata = {
  title: "Corrections policy",
  description: "How Israel Sports Pulse reviews, corrects and records material errors.",
};

export default function CorrectionsPage() {
  return (
    <GovernancePage
      eyebrow="Editorial accountability"
      title="Corrections that improve the record."
      introduction="Accuracy is a continuing obligation. ILSP corrects material errors promptly, explains meaningful changes and preserves the distinction between a correction, an update and a developing story."
      updated="16 July 2026"
      sections={[
        {
          title: "What we correct",
          paragraphs: [
            "We correct factual errors in names, identities, scores, dates, competition status, quotations, statistics, contracts, injuries, disciplinary decisions and other material claims. Spelling or formatting fixes that do not change meaning may be made without a formal note.",
            "A disagreement with analysis is not automatically a factual error. When an interpretation rests on an incorrect fact, however, both the fact and the resulting analysis are reviewed.",
          ],
        },
        {
          title: "How corrections appear",
          items: [
            "A material correction is attached to the article with a clear description of what changed.",
            "A developing report may be updated as new confirmed information arrives; the updated time changes accordingly.",
            "A headline or homepage promotion is corrected wherever the same error appears.",
            "A story is withdrawn only when its central claim cannot be sustained or continued publication creates a compelling legal or safety concern.",
          ],
        },
        {
          title: "Requesting a review",
          paragraphs: [
            "Correction requests should identify the article, the specific claim in question, the proposed correction and any supporting record. Send requests to corrections@ilsportspulse.com. We prioritise clear, evidence-led submissions and may contact the requester for documentation or context.",
            "Commercial partners, clubs, athletes and public bodies receive the same factual review as any reader. Sponsorship or access does not create a right to alter accurate reporting.",
          ],
        },
      ]}
    />
  );
}
