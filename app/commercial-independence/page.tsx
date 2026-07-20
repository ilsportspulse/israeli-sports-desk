import type { Metadata } from "next";

import { GovernancePage } from "@/components/governance-page";

export const metadata: Metadata = {
  title: "Commercial independence",
  description: "The editorial safeguards governing Israel Sports Pulse funding and partnerships.",
};

export default function CommercialIndependencePage() {
  return (
    <GovernancePage
      eyebrow="Editorial independence"
      title="Funding supports the work. It does not control it."
      introduction="ILSP may be funded through sponsorship, advertising, grants, services or audience products. Those relationships must be visible, bounded and structurally separate from editorial judgement."
      updated="16 July 2026"
      sections={[
        {
          title: "The editorial firewall",
          items: [
            "Partners cannot buy favourable coverage, suppress accurate reporting or determine homepage rank.",
            "Editorial staff retain control over headlines, story selection, corrections, analysis and publication timing.",
            "A commercial relationship does not guarantee coverage of a partner, event, club or athlete.",
            "Corrections and public-interest reporting cannot be delayed or blocked for commercial reasons.",
          ],
        },
        {
          title: "Labelling and reader clarity",
          paragraphs: [
            "Paid placements, partner messages and sponsored projects are labelled prominently enough that a reasonable reader can distinguish them from independent journalism before engaging with the material. Brand visibility in a product or event does not convert surrounding newsroom coverage into sponsored content.",
            "Affiliate relationships, supplied travel or significant non-cash support are disclosed when they could reasonably affect how a reader evaluates the work. ILSP does not publish disguised betting prompts or present promotional claims as reporting.",
          ],
        },
        {
          title: "Conflicts and access",
          paragraphs: [
            "Writers and editors should disclose material personal, financial or organisational conflicts before taking part in coverage. Access to athletes, clubs, federations or events is valuable but does not entitle the provider to pre-publication approval. Factual checks may be put to a subject without surrendering editorial control.",
          ],
        },
        {
          title: "Partnership review",
          paragraphs: [
            "ILSP may decline or end a commercial relationship that creates an unacceptable conflict, undermines reader trust or attempts to influence independent reporting. Questions about commercial labelling or partner conduct may be sent to partnerships@ilsportspulse.com; factual correction requests follow the separate corrections policy.",
          ],
        },
      ]}
    />
  );
}
