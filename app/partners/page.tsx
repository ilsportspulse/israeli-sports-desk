import type { Metadata } from "next";

import { BrandLockup } from "@/components/brand";
import { CheckIcon, GlobeIcon, HomeIcon, TrophyIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedLink as Link } from "@/components/localized-link";
import { PartnerContactForm } from "@/components/partner-contact-form";
import { translator } from "@/lib/i18n/ui";
import { getRequestLocale } from "@/lib/request-locale";
import type { LocaleCode } from "@/lib/locales";

type PartnersCopy = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  waysTitle: string;
  ways: { title: string; copy: string }[];
  firewallEyebrow: string;
  firewallTitle: string;
  firewallLede: string;
  firewall: string[];
  contactEyebrow: string;
  contactTitle: string;
  contactBody: string;
};

const COPY: Record<LocaleCode, PartnersCopy> = {
  en: {
    metaTitle: "Partnerships & sponsorship — Israel Sports Pulse",
    metaDescription: "Reach millions of English-speaking Jewish and Israeli sports fans worldwide. Partner with or sponsor Israel Sports Pulse — brand-safe, mission-driven, editorially independent.",
    heroEyebrow: "Partnerships & sponsorship",
    heroTitle: "Reach the world's Israeli sports fans.",
    heroLede: "Israel Sports Pulse is the first English-language home for Israeli sport — live now, updating around the clock in English, French and Spanish. It puts your brand in front of an engaged, global, hard-to-reach audience of Jewish and Israeli supporters, in a premium, brand-safe, Israeli-pride environment.",
    waysTitle: "Ways to work together",
    ways: [
      { title: "Sponsorship", copy: "Section sponsorship, a co-branded Match Centre, newsletter and social integration, or a launch campaign — brand-safe placements clearly labelled and reported on quarterly. Priced per inventory, shaped to your brand." },
      { title: "Partnership & mission funding", copy: "For clubs, federations and diaspora or Jewish organisations: co-marketing to your community, and funding a named part of a transparent budget — photography rights, the Match Centre, the French & Spanish editions." },
      { title: "Club & league media use", copy: "A simple, non-exclusive, always-credited licence to feature your official photos, crest and short clips — free, professional, global English exposure for your club at no cost to you." },
    ],
    firewallEyebrow: "The editorial firewall",
    firewallTitle: "Brand-safe, and independent — both, always.",
    firewallLede: "Commercial support pays for editors and reporters, never for influence. That independence is exactly what makes the environment safe for your brand.",
    firewall: [
      "Funding never buys story approval, source selection, favourable coverage or ranking influence.",
      "Sponsored inventory is always clearly labelled; editorial stays independent.",
      "Youth-facing products carry no betting promotion; conflicts and in-kind support are recorded.",
    ],
    contactEyebrow: "Get in touch",
    contactTitle: "Tell us what you have in mind.",
    contactBody: "Every enquiry is read personally. Share a few lines below and we'll reply from partnership@ilsportspulse.com — usually within a couple of working days. First contact needs no attachments; we'll send the one-pager and a tailored proposal by reply.",
  },
  fr: {
    metaTitle: "Partenariats & parrainage — Israel Sports Pulse",
    metaDescription: "Touchez des millions d’amateurs de sport juifs et israéliens anglophones dans le monde. Devenez partenaire ou parrain d’Israel Sports Pulse — sûr pour la marque, porté par une mission, éditorialement indépendant.",
    heroEyebrow: "Partenariats & parrainage",
    heroTitle: "Touchez les amateurs de sport israélien du monde entier.",
    heroLede: "Israel Sports Pulse est le premier foyer anglophone du sport israélien — en ligne dès maintenant, actualisé 24 h/24 en anglais, en français et en espagnol. Il place votre marque devant un public engagé, mondial et difficile à atteindre de supporters juifs et israéliens, dans un environnement premium, sûr pour la marque et empreint de fierté israélienne.",
    waysTitle: "Comment travailler ensemble",
    ways: [
      { title: "Parrainage", copy: "Parrainage de rubrique, un Match Centre co-brandé, intégration à la newsletter et aux réseaux sociaux, ou une campagne de lancement — des placements sûrs pour la marque, clairement identifiés et rapportés chaque trimestre. Tarifés par inventaire, adaptés à votre marque." },
      { title: "Partenariat & financement de mission", copy: "Pour les clubs, fédérations et organisations juives ou de la diaspora : du co-marketing auprès de votre communauté, et le financement d’une part nommée d’un budget transparent — droits photographiques, le Match Centre, les éditions française et espagnole." },
      { title: "Usage média des clubs & ligues", copy: "Une licence simple, non exclusive et toujours créditée pour mettre en avant vos photos officielles, votre écusson et de courts extraits — une visibilité anglophone gratuite, professionnelle et mondiale pour votre club, sans frais pour vous." },
    ],
    firewallEyebrow: "Le pare-feu éditorial",
    firewallTitle: "Sûr pour la marque, et indépendant — les deux, toujours.",
    firewallLede: "Le soutien commercial paie des éditeurs et des reporters, jamais de l’influence. C’est précisément cette indépendance qui rend l’environnement sûr pour votre marque.",
    firewall: [
      "Le financement n’achète jamais l’approbation d’un article, le choix des sources, une couverture favorable ni une influence sur le classement.",
      "L’inventaire sponsorisé est toujours clairement identifié ; l’éditorial reste indépendant.",
      "Les produits destinés aux jeunes ne comportent aucune promotion de paris ; les conflits et les soutiens en nature sont consignés.",
    ],
    contactEyebrow: "Nous contacter",
    contactTitle: "Dites-nous ce que vous avez en tête.",
    contactBody: "Chaque demande est lue personnellement. Écrivez-nous quelques lignes ci-dessous et nous répondrons depuis partnership@ilsportspulse.com — généralement sous quelques jours ouvrés. Le premier contact ne nécessite aucune pièce jointe ; nous enverrons la fiche de présentation et une proposition sur mesure en réponse.",
  },
  es: {
    metaTitle: "Alianzas y patrocinio — Israel Sports Pulse",
    metaDescription: "Llega a millones de aficionados al deporte judíos e israelíes de habla inglesa en todo el mundo. Asóciate o patrocina a Israel Sports Pulse — seguro para la marca, con propósito e editorialmente independiente.",
    heroEyebrow: "Alianzas y patrocinio",
    heroTitle: "Llega a los aficionados al deporte israelí de todo el mundo.",
    heroLede: "Israel Sports Pulse es el primer hogar en inglés del deporte israelí — en directo ya, actualizándose las 24 horas en inglés, francés y español. Sitúa tu marca ante una audiencia comprometida, global y difícil de alcanzar de aficionados judíos e israelíes, en un entorno premium, seguro para la marca y con orgullo israelí.",
    waysTitle: "Formas de trabajar juntos",
    ways: [
      { title: "Patrocinio", copy: "Patrocinio de sección, un Match Centre con marca compartida, integración en newsletter y redes, o una campaña de lanzamiento — inserciones seguras para la marca, claramente etiquetadas e informadas cada trimestre. Con precio por inventario, adaptado a tu marca." },
      { title: "Alianza y financiación con propósito", copy: "Para clubes, federaciones y organizaciones judías o de la diáspora: co-marketing hacia tu comunidad y la financiación de una parte con nombre de un presupuesto transparente — derechos de fotografía, el Match Centre, las ediciones en francés y español." },
      { title: "Uso mediático de clubes y ligas", copy: "Una licencia sencilla, no exclusiva y siempre acreditada para mostrar tus fotos oficiales, tu escudo y clips breves — exposición en inglés gratuita, profesional y global para tu club, sin coste para ti." },
    ],
    firewallEyebrow: "El cortafuegos editorial",
    firewallTitle: "Seguro para la marca e independiente — ambas cosas, siempre.",
    firewallLede: "El apoyo comercial paga a editores y reporteros, nunca influencia. Esa independencia es justo lo que hace que el entorno sea seguro para tu marca.",
    firewall: [
      "La financiación nunca compra la aprobación de un artículo, la selección de fuentes, una cobertura favorable ni influencia sobre el orden.",
      "El inventario patrocinado siempre está claramente etiquetado; lo editorial sigue siendo independiente.",
      "Los productos dirigidos a jóvenes no llevan promoción de apuestas; los conflictos y el apoyo en especie se registran.",
    ],
    contactEyebrow: "Ponte en contacto",
    contactTitle: "Cuéntanos qué tienes en mente.",
    contactBody: "Cada consulta se lee personalmente. Escríbenos unas líneas abajo y responderemos desde partnership@ilsportspulse.com — normalmente en un par de días laborables. El primer contacto no necesita adjuntos; enviaremos la ficha y una propuesta a medida en la respuesta.",
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

const WAY_ICONS = [<TrophyIcon size={20} key="t" />, <GlobeIcon size={20} key="g" />, <CheckIcon size={20} key="c" />];

export default function PartnersPage() {
  const locale = getRequestLocale();
  const copy = COPY[locale] ?? COPY.en;
  const tr = translator(locale);
  return (
    <div className="about-page">
      <header className="article-header about-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup" aria-label={`Israel Sports Pulse — ${tr("nav.home")}`}>
            <BrandLockup />
          </Link>
          <div className="about-header-actions">
            <LanguageSwitcher label={tr("label.language")} />
            <Link href="/" className="article-back"><HomeIcon size={16} /> {tr("label.backToDesk")}</Link>
          </div>
        </div>
      </header>

      <main className="about-main">
        <section className="about-hero-band">
          <div className="about-wrap">
            <span className="about-eyebrow">{copy.heroEyebrow}</span>
            <h1>{copy.heroTitle}</h1>
            <p className="about-lede">{copy.heroLede}</p>
          </div>
        </section>

        <section className="about-wrap about-section">
          <h2>{copy.waysTitle}</h2>
          <div className="about-values">
            {copy.ways.map((w, index) => (
              <div key={w.title} className="about-value">
                <span className="about-value-icon">{WAY_ICONS[index]}</span>
                <h3>{w.title}</h3>
                <p>{w.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-wrap about-section">
          <span className="about-eyebrow dark">{copy.firewallEyebrow}</span>
          <h2>{copy.firewallTitle}</h2>
          <p className="about-body">{copy.firewallLede}</p>
          <div className="about-standards" style={{ marginTop: 18 }}>
            {copy.firewall.map((line) => (
              <div key={line} className="about-standard">
                <span className="about-standard-mark"><CheckIcon size={15} /></span>
                <div><strong>{line}</strong></div>
              </div>
            ))}
          </div>
        </section>

        <section className="about-wrap about-section" id="contact">
          <span className="about-eyebrow dark">{copy.contactEyebrow}</span>
          <h2>{copy.contactTitle}</h2>
          <p className="about-body" style={{ marginBottom: 22 }}>{copy.contactBody}</p>
          <PartnerContactForm locale={locale} />
        </section>
      </main>
    </div>
  );
}
