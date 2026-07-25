import type { Metadata } from "next";

import { GovernancePage } from "@/components/governance-page";
import { getRequestLocale } from "@/lib/request-locale";
import type { LocaleCode } from "@/lib/locales";

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
    metaTitle: "Terms of use",
    metaDescription: "Terms governing access to Israel Sports Pulse journalism and products.",
    eyebrow: "Terms of use",
    title: "Clear rules for using ILSP.",
    introduction: "These terms govern access to Israel Sports Pulse journalism, scores, statistics, interactive features and other products. By using the service, readers agree to use it lawfully and responsibly.",
    updated: "16 July 2026",
    sections: [
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
    ],
  },
  fr: {
    metaTitle: "Conditions d’utilisation",
    metaDescription: "Conditions régissant l’accès au journalisme et aux produits d’Israel Sports Pulse.",
    eyebrow: "Conditions d’utilisation",
    title: "Des règles claires pour utiliser ILSP.",
    introduction: "Ces conditions régissent l’accès au journalisme, aux scores, aux statistiques, aux fonctions interactives et aux autres produits d’Israel Sports Pulse. En utilisant le service, les lecteurs acceptent de l’utiliser de manière légale et responsable.",
    updated: "16 juillet 2026",
    sections: [
      {
        title: "Journalisme et informations en direct",
        paragraphs: [
          "ILSP s’efforce de publier des informations exactes et actuelles, mais le sport évolue vite. Les scores, compositions, calendriers, classements, blessures et décisions disciplinaires peuvent être révisés par la compétition ou l’autorité compétente. Les informations publiées sont fournies à titre d’actualité et d’information générale, et non comme un conseil professionnel juridique, médical, financier ou en matière de paris.",
        ],
      },
      {
        title: "Utilisation autorisée",
        items: [
          "Les lecteurs peuvent créer des liens vers les pages d’ILSP et partager de courts extraits attribués à des fins de discussion ou de commentaire.",
          "La copie systématique, la republication, l’extraction à des fins de revente, la suppression des crédits ou la présentation du travail d’ILSP comme celui d’un autre éditeur sont interdites sans autorisation.",
          "L’accès automatisé doit respecter les contrôles techniques publiés, la capacité du service et la loi applicable.",
          "Les utilisateurs ne doivent pas porter atteinte à la sécurité, usurper l’identité d’un tiers ni utiliser le service pour diffuser des contenus illicites ou nuisibles.",
        ],
      },
      {
        title: "Droits et contenus de tiers",
        paragraphs: [
          "ILSP détient ou concède sous licence ses textes, sa conception et ses éléments de produit originaux. Les photographies, vidéos, statistiques, écussons de clubs et autres contenus de tiers restent soumis à leurs droits, crédits et conditions de licence respectifs. Un lien vers un autre service ne signifie pas qu’ILSP contrôle ou approuve ce service.",
        ],
      },
      {
        title: "Disponibilité et responsabilité",
        paragraphs: [
          "Le service peut modifier, suspendre ou supprimer des fonctions pour des raisons de sécurité, de maintenance, de droits ou d’exploitation. Dans les limites permises par la loi applicable, ILSP n’est pas responsable des pertes indirectes découlant de la confiance accordée à des données en direct retardées, à des services tiers ou à une utilisation non autorisée du site.",
          "Les questions relatives à ces conditions peuvent être envoyées à legal@ilsportspulse.com. Le fait de ne pas faire appliquer une disposition ne prive pas du droit de la faire appliquer ultérieurement ; si une disposition est invalide, les autres continuent de s’appliquer.",
        ],
      },
    ],
  },
  es: {
    metaTitle: "Condiciones de uso",
    metaDescription: "Condiciones que regulan el acceso al periodismo y los productos de Israel Sports Pulse.",
    eyebrow: "Condiciones de uso",
    title: "Reglas claras para usar ILSP.",
    introduction: "Estas condiciones regulan el acceso al periodismo, los resultados, las estadísticas, las funciones interactivas y otros productos de Israel Sports Pulse. Al usar el servicio, los lectores aceptan usarlo de forma legal y responsable.",
    updated: "16 de julio de 2026",
    sections: [
      {
        title: "Periodismo e información en directo",
        paragraphs: [
          "ILSP trabaja para publicar información exacta y actual, pero el deporte cambia rápido. Los resultados, alineaciones, calendarios, clasificaciones, lesiones y decisiones disciplinarias pueden ser revisados por la competición o autoridad responsable. La información publicada se ofrece como noticia e información general, no como asesoramiento profesional legal, médico, financiero o de apuestas.",
        ],
      },
      {
        title: "Uso permitido",
        items: [
          "Los lectores pueden enlazar a las páginas de ILSP y compartir breves extractos atribuidos para debate o comentario.",
          "Queda prohibido, sin autorización, copiar de forma sistemática, republicar, extraer datos para reventa, eliminar créditos o presentar el trabajo de ILSP como obra de otro editor.",
          "El acceso automatizado debe respetar los controles técnicos publicados, la capacidad del servicio y la ley aplicable.",
          "Los usuarios no deben interferir con la seguridad, suplantar a otra persona ni usar el servicio para distribuir material ilícito o dañino.",
        ],
      },
      {
        title: "Derechos y material de terceros",
        paragraphs: [
          "ILSP posee o licencia sus textos, diseño y elementos de producto originales. Las fotografías, vídeos, estadísticas, escudos de clubes y demás material de terceros siguen sujetos a sus respectivos derechos, créditos y condiciones de licencia. Un enlace a otro servicio no significa que ILSP controle o respalde dicho servicio.",
        ],
      },
      {
        title: "Disponibilidad y responsabilidad",
        paragraphs: [
          "El servicio puede cambiar, pausar o retirar funciones por motivos de seguridad, mantenimiento, derechos u operativos. En la medida en que lo permita la ley aplicable, ILSP no se responsabiliza de las pérdidas indirectas derivadas de confiar en datos en directo retrasados, servicios de terceros o el uso no autorizado del sitio.",
          "Las preguntas sobre estas condiciones pueden enviarse a legal@ilsportspulse.com. No exigir el cumplimiento de una disposición no renuncia al derecho de exigirlo más adelante; si una disposición es inválida, las demás siguen aplicándose.",
        ],
      },
    ],
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { title: copy.metaTitle, description: copy.metaDescription };
}

export default function TermsPage() {
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
