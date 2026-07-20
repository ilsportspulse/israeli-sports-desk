import type { Metadata } from "next";

import { GovernancePage } from "@/components/governance-page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How Israel Sports Pulse handles reader information and service data.",
};

export default function PrivacyPage() {
  return (
    <GovernancePage
      eyebrow="Reader privacy"
      title="Useful data, collected with restraint."
      introduction="ILSP is designed to inform readers, not to build unnecessary personal profiles. We collect only information needed to operate, secure and improve the service or to provide something a reader has requested."
      updated="16 July 2026"
      sections={[
        {
          title: "Information we may receive",
          items: [
            "Technical records such as IP address, device and browser information, requested pages, timestamps and security events.",
            "Contact details a reader chooses to provide for newsletters, correction requests, account features or direct correspondence.",
            "Preference and engagement information needed to remember settings or understand aggregate product performance.",
          ],
        },
        {
          title: "How information is used",
          paragraphs: [
            "We use information to deliver pages and requested communications, protect the service, diagnose faults, measure audience performance in aggregate and meet legal obligations. We do not sell personal information. Advertising or sponsorship measurement must not give a partner access to ILSP editorial records or identifiable reader data unless a reader has clearly consented to a specific service.",
          ],
        },
        {
          title: "Storage, sharing and choices",
          paragraphs: [
            "Service providers may process limited information on ILSP's behalf for hosting, security, analytics, email delivery or other necessary operations. They are expected to use it only for the contracted purpose and to protect it appropriately. Information may also be disclosed when required by law or to defend the safety and integrity of the service.",
            "Readers may request access, correction or deletion of personal information, subject to legal and journalistic-record obligations, by writing to privacy@ilsportspulse.com. Newsletter messages will include an unsubscribe route when that service is active.",
          ],
        },
        {
          title: "Journalistic material",
          paragraphs: [
            "Privacy requests involving published journalism are assessed separately from ordinary account data. Public-interest reporting, source protection, freedom of expression and the integrity of the historical record may require information to be retained even when other service data can be removed.",
          ],
        },
      ]}
    />
  );
}
