import type { Metadata } from "next";

import { GovernancePage } from "@/components/governance-page";
import { getRequestLocale } from "@/lib/request-locale";
import type { LocaleCode } from "@/lib/locales";
import { pageAlternates } from "@/lib/seo-alternates";

type PolicyCopy = {
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  title: string;
  introduction: string;
  updated: string;
  sections: { title: string; paragraphs?: string[]; items?: string[] }[];
};

const COPY: Record<LocaleCode, PolicyCopy> = {
  en: {
    metaTitle: "Commercial independence",
    metaDescription: "The editorial safeguards governing Israel Sports Pulse funding and partnerships.",
    eyebrow: "Editorial independence",
    title: "Funding supports the work. It does not control it.",
    introduction: "ILSP may be funded through sponsorship, advertising, grants, services or audience products. Those relationships must be visible, bounded and structurally separate from editorial judgement.",
    updated: "16 July 2026",
    sections: [
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
    ],
  },
  fr: {
    metaTitle: "Indépendance commerciale",
    metaDescription: "Les garanties éditoriales encadrant le financement et les partenariats d’Israel Sports Pulse.",
    eyebrow: "Indépendance éditoriale",
    title: "Le financement soutient le travail. Il ne le contrôle pas.",
    introduction: "ILSP peut être financé par du parrainage, de la publicité, des subventions, des services ou des produits d’audience. Ces relations doivent être visibles, encadrées et structurellement séparées du jugement éditorial.",
    updated: "16 juillet 2026",
    sections: [
      {
        title: "Le pare-feu éditorial",
        items: [
          "Les partenaires ne peuvent pas acheter une couverture favorable, étouffer un reportage exact ni déterminer le classement en page d’accueil.",
          "L’équipe éditoriale conserve le contrôle des titres, du choix des sujets, des corrections, de l’analyse et du moment de publication.",
          "Une relation commerciale ne garantit pas la couverture d’un partenaire, d’un événement, d’un club ou d’un athlète.",
          "Les corrections et le reportage d’intérêt public ne peuvent être retardés ni bloqués pour des raisons commerciales.",
        ],
      },
      {
        title: "Étiquetage et clarté pour le lecteur",
        paragraphs: [
          "Les placements payants, les messages de partenaires et les projets sponsorisés sont signalés assez clairement pour qu’un lecteur raisonnable puisse les distinguer du journalisme indépendant avant de consulter le contenu. La visibilité d’une marque dans un produit ou un événement ne transforme pas la couverture rédactionnelle environnante en contenu sponsorisé.",
          "Les relations d’affiliation, les voyages offerts ou un soutien important en nature sont divulgués lorsqu’ils pourraient raisonnablement influencer la façon dont un lecteur évalue le travail. ILSP ne publie pas d’incitations aux paris déguisées et ne présente pas d’affirmations promotionnelles comme du reportage.",
        ],
      },
      {
        title: "Conflits et accès",
        paragraphs: [
          "Les rédacteurs et éditeurs doivent divulguer tout conflit personnel, financier ou organisationnel important avant de participer à une couverture. L’accès aux athlètes, clubs, fédérations ou événements a de la valeur mais ne donne pas droit à une approbation avant publication. Des vérifications factuelles peuvent être soumises à un sujet sans renoncer au contrôle éditorial.",
        ],
      },
      {
        title: "Examen des partenariats",
        paragraphs: [
          "ILSP peut refuser ou mettre fin à une relation commerciale qui crée un conflit inacceptable, mine la confiance des lecteurs ou tente d’influencer un reportage indépendant. Les questions relatives à l’étiquetage commercial ou à la conduite d’un partenaire peuvent être envoyées à partnerships@ilsportspulse.com ; les demandes de correction factuelle suivent la politique de corrections distincte.",
        ],
      },
    ],
  },
  es: {
    metaTitle: "Independencia comercial",
    metaDescription: "Las salvaguardas editoriales que rigen la financiación y las alianzas de Israel Sports Pulse.",
    eyebrow: "Independencia editorial",
    title: "La financiación sostiene el trabajo. No lo controla.",
    introduction: "ILSP puede financiarse mediante patrocinio, publicidad, subvenciones, servicios o productos de audiencia. Esas relaciones deben ser visibles, delimitadas y estructuralmente separadas del criterio editorial.",
    updated: "16 de julio de 2026",
    sections: [
      {
        title: "El cortafuegos editorial",
        items: [
          "Los socios no pueden comprar una cobertura favorable, suprimir un reportaje exacto ni determinar el orden en la portada.",
          "El equipo editorial conserva el control sobre los titulares, la selección de temas, las correcciones, el análisis y el momento de publicación.",
          "Una relación comercial no garantiza la cobertura de un socio, evento, club o deportista.",
          "Las correcciones y el periodismo de interés público no pueden retrasarse ni bloquearse por motivos comerciales.",
        ],
      },
      {
        title: "Etiquetado y claridad para el lector",
        paragraphs: [
          "Las inserciones pagadas, los mensajes de socios y los proyectos patrocinados se etiquetan de forma lo bastante destacada como para que un lector razonable pueda distinguirlos del periodismo independiente antes de interactuar con el material. La visibilidad de una marca en un producto o evento no convierte la cobertura periodística circundante en contenido patrocinado.",
          "Las relaciones de afiliación, los viajes facilitados o el apoyo significativo no monetario se divulgan cuando puedan afectar razonablemente a cómo un lector evalúa el trabajo. ILSP no publica reclamos de apuestas encubiertos ni presenta afirmaciones promocionales como reportaje.",
        ],
      },
      {
        title: "Conflictos y acceso",
        paragraphs: [
          "Redactores y editores deben divulgar cualquier conflicto personal, financiero u organizativo relevante antes de participar en una cobertura. El acceso a deportistas, clubes, federaciones o eventos es valioso, pero no da derecho a la aprobación previa a la publicación. Se pueden plantear verificaciones factuales a un sujeto sin renunciar al control editorial.",
        ],
      },
      {
        title: "Revisión de alianzas",
        paragraphs: [
          "ILSP puede rechazar o poner fin a una relación comercial que cree un conflicto inaceptable, socave la confianza del lector o intente influir en un reportaje independiente. Las preguntas sobre el etiquetado comercial o la conducta de un socio pueden enviarse a partnerships@ilsportspulse.com; las solicitudes de corrección factual siguen la política de correcciones aparte.",
        ],
      },
    ],
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { alternates: pageAlternates("/commercial-independence"), title: copy.metaTitle, description: copy.metaDescription };
}

export default function CommercialIndependencePage() {
  const locale = getRequestLocale();
  const copy = COPY[locale] ?? COPY.en;
  return (
    <GovernancePage
      eyebrow={copy.eyebrow}
      title={copy.title}
      introduction={copy.introduction}
      updated={copy.updated}
      sections={copy.sections}
      locale={locale}
    />
  );
}
