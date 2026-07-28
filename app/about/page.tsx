import type { Metadata } from "next";

import { BrandLockup } from "@/components/brand";
import { ArrowIcon, BoltIcon, CheckIcon, GlobeIcon, HomeIcon, TableIcon, TrophyIcon } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";
import { LocalizedLink as Link } from "@/components/localized-link";
import { translator } from "@/lib/i18n/ui";
import { getRequestLocale } from "@/lib/request-locale";
import type { LocaleCode } from "@/lib/locales";
import { pageAlternates } from "@/lib/seo-alternates";

type AboutCopy = {
  metaTitle: string;
  metaDescription: string;
  heroEyebrow: string;
  heroTitle: string;
  heroLede: string;
  standForTitle: string;
  values: { title: string; copy: string }[];
  whyEyebrow: string;
  whyTitle: string;
  whyBody: string[];
  startedEyebrow: string;
  startedTitle: string;
  startedBody: string[];
  howEyebrow: string;
  howTitle: string;
  standards: { title: string; copy: string }[];
  commercialLink: string;
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

const COPY: Record<LocaleCode, AboutCopy> = {
  en: {
    metaTitle: "About Israel Sports Pulse",
    metaDescription: "Israel Sports Pulse is a trusted English-language home for Israeli sport — verified reporting, live scores and the context behind the story.",
    heroEyebrow: "About Israel Sports Pulse",
    heroTitle: "A trusted English home for Israeli sport.",
    heroLede: "Israel Sports Pulse is built for everyone who cares about Israeli sport but cannot always reach it in Hebrew — Israelis abroad, communities around the world and every supporter drawn to the clubs, athletes and sporting culture of Israel. Verified reporting, live scores and the context behind the story, every day.",
    standForTitle: "What we stand for",
    values: [
      { title: "Verified, never invented", copy: "Every material fact is checked against at least two independent, named sources. When something cannot be confirmed, we say so — we never manufacture a score, a quote or a result." },
      { title: "Israeli sport, in clear English", copy: "Results travel; names, atmosphere and context often do not. We bring English-speaking supporters properly inside the story, wherever they follow from." },
      { title: "Fast, then right", copy: "We report quickly, then keep working — adding context, updating live and correcting openly the moment we learn more." },
      { title: "The whole system", copy: "Football and basketball, Olympic and youth sport, the lower divisions, the women's game, the history — and every Israeli competing abroad." },
    ],
    whyEyebrow: "Why we exist",
    whyTitle: "Israeli sport deserves a serious English voice.",
    whyBody: [
      "For English-speaking supporters, following Israeli sport has long meant piecing together fragments: a scoreline here, a transfer rumour there, rarely the full picture. ILSP closes that gap — one place for the news, the scores, the standings and the detail, reported to a professional standard and written to be genuinely readable.",
      "Sport can give a dispersed audience one shared place. Israeli or not, anyone who wants welcoming, detailed English coverage should be able to understand the competition and join the conversation.",
    ],
    startedEyebrow: "How it started",
    startedTitle: "One supporter, following from afar.",
    startedBody: [
      "ILSP began with one supporter — born in Tel Aviv to an Israeli mother and a Belgian father — who left the country more than a decade ago and kept following its sport from abroad. Reaching it in English meant piecing together scraps, and often missing the story altogether. ILSP is the publication that supporter wanted to read: complete, verified and genuinely readable.",
      "The founder stays deliberately in the background so the journalism speaks for itself. Funding pays for editors and reporters, not for influence — commercial partners can never buy coverage, shape a story or delay a correction.",
    ],
    howEyebrow: "How we work",
    howTitle: "Standards, not shortcuts.",
    standards: [
      { title: "Two independent sources", copy: "Material facts are cross-checked before publication; uncertain claims stay clearly labelled as uncertain." },
      { title: "Open corrections", copy: "When we get something wrong we fix it in the open, with a note on the article — not quietly." },
      { title: "Editorial independence", copy: "Commercial partnerships never influence what we cover or how we cover it." },
      { title: "Rights-cleared media", copy: "Only exact, correctly-licensed imagery and embeds — nothing misattributed." },
    ],
    commercialLink: "Our commercial-independence standard",
    ctaTitle: "Follow the whole story.",
    ctaBody: "Live scores, the Match Center, the Retro archive and daily reporting across Israeli sport.",
    ctaPrimary: "Open the Match Center",
    ctaSecondary: "Browse every story",
  },
  fr: {
    metaTitle: "À propos d’Israel Sports Pulse",
    metaDescription: "Israel Sports Pulse est un foyer anglophone de confiance pour le sport israélien — reportages vérifiés, scores en direct et le contexte derrière l’actualité.",
    heroEyebrow: "À propos d’Israel Sports Pulse",
    heroTitle: "Un foyer anglophone de confiance pour le sport israélien.",
    heroLede: "Israel Sports Pulse s’adresse à tous ceux qui tiennent au sport israélien mais ne peuvent pas toujours le suivre en hébreu — les Israéliens à l’étranger, les communautés du monde entier et chaque supporter attiré par les clubs, les athlètes et la culture sportive d’Israël. Des reportages vérifiés, des scores en direct et le contexte derrière l’actualité, chaque jour.",
    standForTitle: "Ce que nous défendons",
    values: [
      { title: "Vérifié, jamais inventé", copy: "Chaque fait important est vérifié auprès d’au moins deux sources indépendantes et nommées. Lorsqu’une information ne peut être confirmée, nous le disons — nous ne fabriquons jamais un score, une citation ou un résultat." },
      { title: "Le sport israélien, en anglais clair", copy: "Les résultats voyagent ; les noms, l’atmosphère et le contexte, souvent non. Nous plaçons vraiment les supporters anglophones au cœur de l’histoire, où qu’ils la suivent." },
      { title: "Vite, puis juste", copy: "Nous rapportons rapidement, puis nous continuons de travailler — en ajoutant du contexte, en actualisant en direct et en corrigeant ouvertement dès que nous en savons plus." },
      { title: "Tout le système", copy: "Football et basket-ball, sport olympique et sport de jeunes, divisions inférieures, football féminin, histoire — et chaque Israélien qui concourt à l’étranger." },
    ],
    whyEyebrow: "Pourquoi nous existons",
    whyTitle: "Le sport israélien mérite une voix sérieuse en anglais.",
    whyBody: [
      "Pour les supporters anglophones, suivre le sport israélien a longtemps voulu dire rassembler des fragments : un score par-ci, une rumeur de transfert par-là, rarement le tableau complet. ILSP comble ce manque — un seul endroit pour l’actualité, les scores, les classements et le détail, traité selon des standards professionnels et écrit pour être vraiment lisible.",
      "Le sport peut offrir à un public dispersé un lieu partagé. Israélien ou non, quiconque souhaite une couverture anglaise accueillante et détaillée doit pouvoir comprendre la compétition et rejoindre la conversation.",
    ],
    startedEyebrow: "Comment tout a commencé",
    startedTitle: "Un supporter, qui suit de loin.",
    startedBody: [
      "ILSP est né d’un supporter — né à Tel-Aviv d’une mère israélienne et d’un père belge — qui a quitté le pays il y a plus de dix ans et a continué à suivre son sport depuis l’étranger. Y accéder en anglais revenait à rassembler des bribes, et souvent à passer à côté de l’histoire. ILSP est la publication que ce supporter voulait lire : complète, vérifiée et vraiment lisible.",
      "Le fondateur reste délibérément en retrait pour que le journalisme parle de lui-même. Le financement paie des éditeurs et des reporters, pas de l’influence — les partenaires commerciaux ne peuvent jamais acheter une couverture, orienter un article ni retarder une correction.",
    ],
    howEyebrow: "Comment nous travaillons",
    howTitle: "Des standards, pas des raccourcis.",
    standards: [
      { title: "Deux sources indépendantes", copy: "Les faits importants sont recoupés avant publication ; les affirmations incertaines restent clairement signalées comme telles." },
      { title: "Corrections ouvertes", copy: "Quand nous nous trompons, nous le corrigeons ouvertement, avec une note sur l’article — pas discrètement." },
      { title: "Indépendance éditoriale", copy: "Les partenariats commerciaux n’influencent jamais ce que nous couvrons ni la façon de le couvrir." },
      { title: "Médias aux droits vérifiés", copy: "Uniquement des images et intégrations exactes et correctement licenciées — rien de mal attribué." },
    ],
    commercialLink: "Notre standard d’indépendance commerciale",
    ctaTitle: "Suivez toute l’histoire.",
    ctaBody: "Scores en direct, le Match Center, les archives Rétro et un reportage quotidien sur tout le sport israélien.",
    ctaPrimary: "Ouvrir le Match Center",
    ctaSecondary: "Parcourir tous les articles",
  },
  es: {
    metaTitle: "Acerca de Israel Sports Pulse",
    metaDescription: "Israel Sports Pulse es un hogar en inglés de confianza para el deporte israelí — periodismo verificado, resultados en directo y el contexto tras la noticia.",
    heroEyebrow: "Acerca de Israel Sports Pulse",
    heroTitle: "Un hogar en inglés de confianza para el deporte israelí.",
    heroLede: "Israel Sports Pulse está pensado para todos los que se preocupan por el deporte israelí pero no siempre pueden seguirlo en hebreo — israelíes en el extranjero, comunidades de todo el mundo y cada aficionado atraído por los clubes, los deportistas y la cultura deportiva de Israel. Periodismo verificado, resultados en directo y el contexto tras la noticia, cada día.",
    standForTitle: "Lo que defendemos",
    values: [
      { title: "Verificado, nunca inventado", copy: "Cada dato relevante se contrasta con al menos dos fuentes independientes e identificadas. Cuando algo no puede confirmarse, lo decimos — nunca fabricamos un resultado, una cita o un marcador." },
      { title: "Deporte israelí, en inglés claro", copy: "Los resultados viajan; los nombres, el ambiente y el contexto a menudo no. Metemos de lleno a los aficionados de habla inglesa en la historia, desde donde sea que la sigan." },
      { title: "Rápido, y luego exacto", copy: "Informamos con rapidez y luego seguimos trabajando — añadiendo contexto, actualizando en directo y corrigiendo abiertamente en cuanto sabemos más." },
      { title: "Todo el sistema", copy: "Fútbol y baloncesto, deporte olímpico y de base, las divisiones inferiores, el fútbol femenino, la historia — y cada israelí que compite en el extranjero." },
    ],
    whyEyebrow: "Por qué existimos",
    whyTitle: "El deporte israelí merece una voz seria en inglés.",
    whyBody: [
      "Para los aficionados de habla inglesa, seguir el deporte israelí ha significado durante mucho tiempo juntar fragmentos: un marcador aquí, un rumor de fichaje allá, rara vez el cuadro completo. ILSP cierra esa brecha — un solo lugar para las noticias, los resultados, las clasificaciones y el detalle, con un nivel profesional y escrito para ser realmente legible.",
      "El deporte puede dar a una audiencia dispersa un lugar compartido. Israelí o no, cualquiera que quiera una cobertura en inglés cercana y detallada debería poder entender la competición y sumarse a la conversación.",
    ],
    startedEyebrow: "Cómo empezó",
    startedTitle: "Un aficionado, siguiéndolo desde lejos.",
    startedBody: [
      "ILSP comenzó con un aficionado — nacido en Tel Aviv de madre israelí y padre belga — que dejó el país hace más de una década y siguió su deporte desde el extranjero. Alcanzarlo en inglés significaba juntar retazos, y a menudo perderse la historia por completo. ILSP es la publicación que ese aficionado quería leer: completa, verificada y realmente legible.",
      "El fundador permanece deliberadamente en segundo plano para que el periodismo hable por sí mismo. La financiación paga a editores y reporteros, no influencia — los socios comerciales nunca pueden comprar cobertura, moldear un artículo o retrasar una corrección.",
    ],
    howEyebrow: "Cómo trabajamos",
    howTitle: "Normas, no atajos.",
    standards: [
      { title: "Dos fuentes independientes", copy: "Los datos relevantes se contrastan antes de publicar; las afirmaciones inciertas se etiquetan claramente como inciertas." },
      { title: "Correcciones abiertas", copy: "Cuando nos equivocamos, lo corregimos a la vista, con una nota en el artículo — no en silencio." },
      { title: "Independencia editorial", copy: "Las alianzas comerciales nunca influyen en lo que cubrimos ni en cómo lo cubrimos." },
      { title: "Medios con derechos verificados", copy: "Solo imágenes e integraciones exactas y correctamente licenciadas — nada mal atribuido." },
    ],
    commercialLink: "Nuestra norma de independencia comercial",
    ctaTitle: "Sigue toda la historia.",
    ctaBody: "Resultados en directo, el Match Center, el archivo Retro y periodismo diario sobre todo el deporte israelí.",
    ctaPrimary: "Abrir el Match Center",
    ctaSecondary: "Ver todas las noticias",
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { alternates: pageAlternates("/about"), title: copy.metaTitle, description: copy.metaDescription };
}

const VALUE_ICONS = [<CheckIcon size={20} key="c" />, <GlobeIcon size={20} key="g" />, <BoltIcon size={20} key="b" />, <TableIcon size={20} key="t" />];

export default function AboutPage() {
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
          <h2>{copy.standForTitle}</h2>
          <div className="about-values">
            {copy.values.map((value, index) => (
              <div key={value.title} className="about-value">
                <span className="about-value-icon">{VALUE_ICONS[index]}</span>
                <h3>{value.title}</h3>
                <p>{value.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="about-wrap about-section">
          <span className="about-eyebrow dark">{copy.whyEyebrow}</span>
          <h2>{copy.whyTitle}</h2>
          {copy.whyBody.map((paragraph) => <p key={paragraph} className="about-body">{paragraph}</p>)}
        </section>

        <section className="about-wrap about-section">
          <span className="about-eyebrow dark">{copy.startedEyebrow}</span>
          <h2>{copy.startedTitle}</h2>
          {copy.startedBody.map((paragraph) => <p key={paragraph} className="about-body">{paragraph}</p>)}
        </section>

        <section className="about-standards-band">
          <div className="about-wrap">
            <span className="about-eyebrow">{copy.howEyebrow}</span>
            <h2>{copy.howTitle}</h2>
            <div className="about-standards">
              {copy.standards.map((standard) => (
                <div key={standard.title} className="about-standard">
                  <span className="about-standard-mark"><CheckIcon size={15} /></span>
                  <div>
                    <strong>{standard.title}</strong>
                    <span>{standard.copy}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/commercial-independence" className="about-inline-link">{copy.commercialLink} <ArrowIcon size={16} /></Link>
          </div>
        </section>

        <section className="about-wrap about-cta">
          <span className="about-cta-icon"><TrophyIcon size={26} /></span>
          <h2>{copy.ctaTitle}</h2>
          <p>{copy.ctaBody}</p>
          <div className="about-cta-links">
            <Link href="/scores" className="about-cta-primary">{copy.ctaPrimary} <ArrowIcon size={17} /></Link>
            <Link href="/stories" className="about-cta-secondary">{copy.ctaSecondary}</Link>
          </div>
        </section>
      </main>
    </div>
  );
}
