import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { ArrowIcon, BoltIcon, CheckIcon, GlobeIcon, HomeIcon, TableIcon, TrophyIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "About Israel Sports Pulse",
  description: "Israel Sports Pulse is a trusted English-language home for Israeli sport — verified reporting, live scores and the context behind the story.",
};

const values = [
  {
    icon: <CheckIcon size={20} />,
    title: "Verified, never invented",
    copy: "Every material fact is checked against at least two independent, named sources. When something cannot be confirmed, we say so — we never manufacture a score, a quote or a result.",
  },
  {
    icon: <GlobeIcon size={20} />,
    title: "Israeli sport, in clear English",
    copy: "Results travel; names, atmosphere and context often do not. We bring English-speaking supporters properly inside the story, wherever they follow from.",
  },
  {
    icon: <BoltIcon size={20} />,
    title: "Fast, then right",
    copy: "We report quickly, then keep working — adding context, updating live and correcting openly the moment we learn more.",
  },
  {
    icon: <TableIcon size={20} />,
    title: "The whole system",
    copy: "Football and basketball, Olympic and youth sport, the lower divisions, the women's game, the history — and every Israeli competing abroad.",
  },
];

const standards = [
  { title: "Two independent sources", copy: "Material facts are cross-checked before publication; uncertain claims stay clearly labelled as uncertain." },
  { title: "Open corrections", copy: "When we get something wrong we fix it in the open, with a note on the article — not quietly." },
  { title: "Editorial independence", copy: "Commercial partnerships never influence what we cover or how we cover it." },
  { title: "Rights-cleared media", copy: "Only exact, correctly-licensed imagery and embeds — nothing misattributed." },
];

export default function AboutPage() {
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
            <span className="about-eyebrow">About Israel Sports Pulse</span>
            <h1>A trusted English home for Israeli sport.</h1>
            <p className="about-lede">
              Israel Sports Pulse is built for everyone who cares about Israeli sport but cannot always reach it in Hebrew —
              Israelis abroad, communities around the world and every supporter drawn to the clubs, athletes and sporting
              culture of Israel. Verified reporting, live scores and the context behind the story, every day.
            </p>
          </div>
        </section>

        <section className="about-wrap about-section">
          <h2>What we stand for</h2>
          <div className="about-values">
            {values.map((value) => (
              <div key={value.title} className="about-value">
                <span className="about-value-icon">{value.icon}</span>
                <h3>{value.title}</h3>
                <p>{value.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-wrap about-section">
          <span className="about-eyebrow dark">Why we exist</span>
          <h2>Israeli sport deserves a serious English voice.</h2>
          <p className="about-body">
            For English-speaking supporters, following Israeli sport has long meant piecing together fragments: a scoreline
            here, a transfer rumour there, rarely the full picture. ILSP closes that gap — one place for the news, the
            scores, the standings and the detail, reported to a professional standard and written to be genuinely readable.
          </p>
          <p className="about-body">
            Sport can give a dispersed audience one shared place. Israeli or not, anyone who wants welcoming, detailed
            English coverage should be able to understand the competition and join the conversation.
          </p>
        </section>

        <section className="about-standards-band">
          <div className="about-wrap">
            <span className="about-eyebrow">How we work</span>
            <h2>Standards, not shortcuts.</h2>
            <div className="about-standards">
              {standards.map((standard) => (
                <div key={standard.title} className="about-standard">
                  <span className="about-standard-mark"><CheckIcon size={15} /></span>
                  <div>
                    <strong>{standard.title}</strong>
                    <span>{standard.copy}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/commercial-independence" className="about-inline-link">Our commercial-independence standard <ArrowIcon size={16} /></Link>
          </div>
        </section>

        <section className="about-wrap about-cta">
          <span className="about-cta-icon"><TrophyIcon size={26} /></span>
          <h2>Follow the whole story.</h2>
          <p>Live scores, the Match Center, the Retro archive and daily reporting across Israeli sport.</p>
          <div className="about-cta-links">
            <Link href="/scores" className="about-cta-primary">Open the Match Center <ArrowIcon size={17} /></Link>
            <Link href="/stories" className="about-cta-secondary">Browse every story</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
