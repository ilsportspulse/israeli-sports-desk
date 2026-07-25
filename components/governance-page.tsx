import { BrandLockup } from "@/components/brand";
import { HomeIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedLink as Link } from "@/components/localized-link";
import { t, translator } from "@/lib/i18n/ui";
import { defaultLocale, type LocaleCode } from "@/lib/locales";

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
  locale?: LocaleCode;
};

const policyLinks: { href: string; key: Parameters<ReturnType<typeof translator>>[0] }[] = [
  { href: "/corrections", key: "label.corrections" },
  { href: "/privacy", key: "footer.privacy" },
  { href: "/terms", key: "footer.terms" },
  { href: "/commercial-independence", key: "footer.commercial" },
];

const GOV: Record<LocaleCode, { standards: string; accountable: string; apply: string; policyIndex: string }> = {
  en: {
    standards: "ILSP standards",
    accountable: "Accountable by design",
    apply: "These policies apply across ILSP reporting, products and commercial relationships.",
    policyIndex: "Policy index",
  },
  fr: {
    standards: "Normes ILSP",
    accountable: "Responsable par conception",
    apply: "Ces politiques s’appliquent à l’ensemble des reportages, produits et relations commerciales d’ILSP.",
    policyIndex: "Index des politiques",
  },
  es: {
    standards: "Normas de ILSP",
    accountable: "Responsable por diseño",
    apply: "Estas políticas se aplican a todos los reportajes, productos y relaciones comerciales de ILSP.",
    policyIndex: "Índice de políticas",
  },
};

export function GovernancePage({ eyebrow, title, introduction, updated, sections, locale = defaultLocale }: GovernancePageProps) {
  const tr = translator(locale);
  const gov = GOV[locale] ?? GOV[defaultLocale];
  return (
    <div className="governance-page">
      <header className="article-header governance-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup" aria-label={`Israel Sports Pulse — ${tr("nav.home")}`}>
            <BrandLockup />
          </Link>
          <nav className="governance-nav" aria-label={tr("aria.legalPolicies")}>
            {policyLinks.map((item) => <Link key={item.href} href={item.href}>{tr(item.key)}</Link>)}
          </nav>
          <div className="governance-nav-actions">
            <LanguageSwitcher label={tr("label.language")} />
            <Link href="/" className="article-back"><HomeIcon size={16} /> {tr("label.backToDesk")}</Link>
          </div>
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
            <time dateTime="2026-07-16">{t(locale, "label.updated")} {updated}</time>
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

          <aside className="governance-aside" aria-label={gov.policyIndex}>
            <span className="eyebrow">{gov.standards}</span>
            <strong>{gov.accountable}</strong>
            <p>{gov.apply}</p>
            <nav>
              {policyLinks.map((item) => <Link key={item.href} href={item.href}>{tr(item.key)}<span aria-hidden="true">→</span></Link>)}
            </nav>
          </aside>
        </div>
      </main>
    </div>
  );
}
