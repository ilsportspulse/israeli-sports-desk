import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { HomeIcon } from "@/components/icons";

type GovernanceSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

type GovernancePageProps = {
  eyebrow: string;
  title: string;
  introduction: string;
  updated: string;
  sections: GovernanceSection[];
};

const policyLinks = [
  { href: "/corrections", label: "Corrections" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/commercial-independence", label: "Commercial independence" },
];

export function GovernancePage({ eyebrow, title, introduction, updated, sections }: GovernancePageProps) {
  return (
    <div className="governance-page">
      <header className="article-header governance-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup" aria-label="Israel Sports Pulse home">
            <BrandLockup />
          </Link>
          <nav className="governance-nav" aria-label="Editorial and legal policies">
            {policyLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <Link href="/" className="article-back"><HomeIcon size={16} /> Back to the desk</Link>
        </div>
      </header>

      <main>
        <section className="governance-hero">
          <div className="page-width governance-hero-inner">
            <div>
              <span className="eyebrow">{eyebrow}</span>
              <h1>{title}</h1>
              <p>{introduction}</p>
            </div>
            <time dateTime="2026-07-16">Updated {updated}</time>
          </div>
        </section>

        <div className="page-width governance-layout">
          <article className="governance-content">
            {sections.map((section) => (
              <section key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.items ? <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
              </section>
            ))}
          </article>

          <aside className="governance-aside" aria-label="Policy index">
            <span className="eyebrow">ILSP standards</span>
            <strong>Accountable by design</strong>
            <p>These policies apply across ILSP reporting, products and commercial relationships.</p>
            <nav>
              {policyLinks.map((item) => <Link key={item.href} href={item.href}>{item.label}<span aria-hidden="true">→</span></Link>)}
            </nav>
          </aside>
        </div>
      </main>
    </div>
  );
}
