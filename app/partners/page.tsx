import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { CheckIcon, GlobeIcon, HomeIcon, TrophyIcon } from "@/components/icons";
import { PartnerContactForm } from "@/components/partner-contact-form";

export const metadata: Metadata = {
  title: "Partnerships & sponsorship — Israel Sports Pulse",
  description:
    "Reach millions of English-speaking Jewish and Israeli sports fans worldwide. Partner with or sponsor Israel Sports Pulse — brand-safe, mission-driven, editorially independent.",
};

const ways = [
  {
    icon: <TrophyIcon size={20} />,
    title: "Sponsorship",
    copy: "Section sponsorship, a co-branded Match Centre, newsletter and social integration, or a launch campaign — brand-safe placements clearly labelled and reported on quarterly. Priced per inventory, shaped to your brand.",
  },
  {
    icon: <GlobeIcon size={20} />,
    title: "Partnership & mission funding",
    copy: "For clubs, federations and diaspora or Jewish organisations: co-marketing to your community, and funding a named part of a transparent budget — photography rights, the Match Centre, the French & Spanish editions.",
  },
  {
    icon: <CheckIcon size={20} />,
    title: "Club & league media use",
    copy: "A simple, non-exclusive, always-credited licence to feature your official photos, crest and short clips — free, professional, global English exposure for your club at no cost to you.",
  },
];

const firewall = [
  "Funding never buys story approval, source selection, favourable coverage or ranking influence.",
  "Sponsored inventory is always clearly labelled; editorial stays independent.",
  "Youth-facing products carry no betting promotion; conflicts and in-kind support are recorded.",
];

export default function PartnersPage() {
  return (
    <div className="about-page">
      <header className="article-header about-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup" aria-label="Israel Sports Pulse home">
            <BrandLockup />
          </Link>
          <Link href="/" className="article-back"><HomeIcon size={16} /> Back to the desk</Link>
        </div>
      </header>

      <main className="about-main">
        <section className="about-hero-band">
          <div className="about-wrap">
            <span className="about-eyebrow">Partnerships &amp; sponsorship</span>
            <h1>Reach the world&apos;s Israeli sports fans.</h1>
            <p className="about-lede">
              Israel Sports Pulse is the first English-language home for Israeli sport — live now, updating around the
              clock in English, French and Spanish. It puts your brand in front of an engaged, global, hard-to-reach
              audience of Jewish and Israeli supporters, in a premium, brand-safe, Israeli-pride environment.
            </p>
          </div>
        </section>

        <section className="about-wrap about-section">
          <h2>Ways to work together</h2>
          <div className="about-values">
            {ways.map((w) => (
              <div key={w.title} className="about-value">
                <span className="about-value-icon">{w.icon}</span>
                <h3>{w.title}</h3>
                <p>{w.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-wrap about-section">
          <span className="about-eyebrow dark">The editorial firewall</span>
          <h2>Brand-safe, and independent — both, always.</h2>
          <p className="about-body">
            Commercial support pays for editors and reporters, never for influence. That independence is exactly what
            makes the environment safe for your brand.
          </p>
          <div className="about-standards" style={{ marginTop: 18 }}>
            {firewall.map((line) => (
              <div key={line} className="about-standard">
                <span className="about-standard-mark"><CheckIcon size={15} /></span>
                <div><strong>{line}</strong></div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-wrap about-section" id="contact">
          <span className="about-eyebrow dark">Get in touch</span>
          <h2>Tell us what you have in mind.</h2>
          <p className="about-body" style={{ marginBottom: 22 }}>
            Every enquiry is read personally. Share a few lines below and we&apos;ll reply from
            {" "}<b>partnership@ilsportspulse.com</b> — usually within a couple of working days. First contact needs no
            attachments; we&apos;ll send the one-pager and a tailored proposal by reply.
          </p>
          <PartnerContactForm />
        </section>
      </main>
    </div>
  );
}
