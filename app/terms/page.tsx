import type { Metadata } from "next";

import { GovernancePage } from "@/components/governance-page";

export const metadata: Metadata = {
  title: "Terms of use",
  description: "Terms governing access to Israel Sports Pulse journalism and products.",
};

export default function TermsPage() {
  return (
    <GovernancePage
      eyebrow="Terms of use"
      title="Clear rules for using ILSP."
      introduction="These terms govern access to Israel Sports Pulse journalism, scores, statistics, interactive features and other products. By using the service, readers agree to use it lawfully and responsibly."
      updated="16 July 2026"
      sections={[
        {
          title: "Journalism and live information",
          paragraphs: [
            "ILSP works to publish accurate, current information, but sport changes quickly. Scores, line-ups, fixtures, tables, injuries and disciplinary decisions can be revised by the responsible competition or authority. Published information is provided for general news and information, not as professional legal, medical, financial or betting advice.",
          ],
        },
        {
          title: "Permitted use",
          items: [
            "Readers may link to ILSP pages and share short attributed excerpts for discussion or commentary.",
            "Systematic copying, republishing, scraping for resale, removal of credits or presentation of ILSP work as another publisher's work is prohibited without permission.",
            "Automated access must respect published technical controls, service capacity and applicable law.",
            "Users must not interfere with security, impersonate another person or use the service to distribute unlawful or harmful material.",
          ],
        },
        {
          title: "Rights and third-party material",
          paragraphs: [
            "ILSP owns or licenses its original writing, design and product elements. Photographs, video, statistics, club marks and other third-party material remain subject to their respective rights, credits and licence terms. A link to another service does not mean ILSP controls or endorses that service.",
          ],
        },
        {
          title: "Availability and responsibility",
          paragraphs: [
            "The service may change, pause or remove features for security, maintenance, rights or operational reasons. To the extent permitted by applicable law, ILSP is not responsible for indirect loss arising from reliance on delayed live data, third-party services or unauthorised use of the site.",
            "Questions about these terms may be sent to legal@ilsportspulse.com. A failure to enforce one provision does not waive the right to enforce it later; if one provision is invalid, the remaining provisions continue to apply.",
          ],
        },
      ]}
    />
  );
}
