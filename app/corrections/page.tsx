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
    metaTitle: "Corrections policy",
    metaDescription: "How Israel Sports Pulse reviews, corrects and records material errors.",
    eyebrow: "Editorial accountability",
    title: "Corrections that improve the record.",
    introduction: "Accuracy is a continuing obligation. ILSP corrects material errors promptly, explains meaningful changes and preserves the distinction between a correction, an update and a developing story.",
    updated: "16 July 2026",
    sections: [
      {
        title: "What we correct",
        paragraphs: [
          "We correct factual errors in names, identities, scores, dates, competition status, quotations, statistics, contracts, injuries, disciplinary decisions and other material claims. Spelling or formatting fixes that do not change meaning may be made without a formal note.",
          "A disagreement with analysis is not automatically a factual error. When an interpretation rests on an incorrect fact, however, both the fact and the resulting analysis are reviewed.",
        ],
      },
      {
        title: "How corrections appear",
        items: [
          "A material correction is attached to the article with a clear description of what changed.",
          "A developing report may be updated as new confirmed information arrives; the updated time changes accordingly.",
          "A headline or homepage promotion is corrected wherever the same error appears.",
          "A story is withdrawn only when its central claim cannot be sustained or continued publication creates a compelling legal or safety concern.",
        ],
      },
      {
        title: "Requesting a review",
        paragraphs: [
          "Correction requests should identify the article, the specific claim in question, the proposed correction and any supporting record. Send requests to corrections@ilsportspulse.com. We prioritise clear, evidence-led submissions and may contact the requester for documentation or context.",
          "Commercial partners, clubs, athletes and public bodies receive the same factual review as any reader. Sponsorship or access does not create a right to alter accurate reporting.",
        ],
      },
    ],
  },
  fr: {
    metaTitle: "Politique de corrections",
    metaDescription: "Comment Israel Sports Pulse examine, corrige et consigne les erreurs importantes.",
    eyebrow: "Responsabilité éditoriale",
    title: "Des corrections qui améliorent l’information.",
    introduction: "L’exactitude est une obligation continue. ILSP corrige rapidement les erreurs importantes, explique les changements significatifs et préserve la distinction entre une correction, une mise à jour et une actualité en évolution.",
    updated: "16 juillet 2026",
    sections: [
      {
        title: "Ce que nous corrigeons",
        paragraphs: [
          "Nous corrigeons les erreurs factuelles portant sur les noms, les identités, les scores, les dates, le statut d’une compétition, les citations, les statistiques, les contrats, les blessures, les décisions disciplinaires et d’autres affirmations importantes. Les corrections d’orthographe ou de mise en forme qui ne changent pas le sens peuvent être effectuées sans note formelle.",
          "Un désaccord avec une analyse n’est pas automatiquement une erreur factuelle. Toutefois, lorsqu’une interprétation repose sur un fait inexact, le fait et l’analyse qui en découle sont tous deux réexaminés.",
        ],
      },
      {
        title: "Comment les corrections apparaissent",
        items: [
          "Une correction importante est jointe à l’article avec une description claire de ce qui a changé.",
          "Un article en évolution peut être mis à jour à mesure que de nouvelles informations confirmées arrivent ; l’heure de mise à jour change en conséquence.",
          "Un titre ou une mise en avant en page d’accueil est corrigé partout où la même erreur apparaît.",
          "Un article n’est retiré que lorsque son affirmation centrale ne peut être maintenue ou que sa publication continue crée un problème juridique ou de sécurité impérieux.",
        ],
      },
      {
        title: "Demander un réexamen",
        paragraphs: [
          "Les demandes de correction doivent identifier l’article, l’affirmation précise en question, la correction proposée et tout élément justificatif. Envoyez vos demandes à corrections@ilsportspulse.com. Nous privilégions les demandes claires et étayées et pouvons contacter le demandeur pour obtenir des documents ou du contexte.",
          "Les partenaires commerciaux, clubs, athlètes et organismes publics bénéficient du même examen factuel que tout lecteur. Un parrainage ou un accès ne crée aucun droit de modifier un reportage exact.",
        ],
      },
    ],
  },
  es: {
    metaTitle: "Política de correcciones",
    metaDescription: "Cómo Israel Sports Pulse revisa, corrige y registra los errores importantes.",
    eyebrow: "Responsabilidad editorial",
    title: "Correcciones que mejoran la información.",
    introduction: "La exactitud es una obligación continua. ILSP corrige con prontitud los errores importantes, explica los cambios significativos y preserva la distinción entre una corrección, una actualización y una noticia en desarrollo.",
    updated: "16 de julio de 2026",
    sections: [
      {
        title: "Qué corregimos",
        paragraphs: [
          "Corregimos errores factuales en nombres, identidades, resultados, fechas, estado de una competición, citas, estadísticas, contratos, lesiones, decisiones disciplinarias y otras afirmaciones importantes. Las correcciones de ortografía o formato que no cambian el significado pueden hacerse sin una nota formal.",
          "Un desacuerdo con un análisis no es automáticamente un error factual. No obstante, cuando una interpretación se basa en un hecho incorrecto, se revisan tanto el hecho como el análisis resultante.",
        ],
      },
      {
        title: "Cómo aparecen las correcciones",
        items: [
          "Una corrección importante se adjunta al artículo con una descripción clara de lo que cambió.",
          "Un reportaje en desarrollo puede actualizarse a medida que llega nueva información confirmada; la hora de actualización cambia en consecuencia.",
          "Un titular o una promoción en portada se corrige allí donde aparezca el mismo error.",
          "Un artículo solo se retira cuando su afirmación central no puede sostenerse o cuando su publicación continuada crea un problema legal o de seguridad ineludible.",
        ],
      },
      {
        title: "Solicitar una revisión",
        paragraphs: [
          "Las solicitudes de corrección deben identificar el artículo, la afirmación concreta en cuestión, la corrección propuesta y cualquier prueba que la respalde. Envía tus solicitudes a corrections@ilsportspulse.com. Damos prioridad a las solicitudes claras y respaldadas por pruebas, y podemos contactar a quien la presenta para pedir documentación o contexto.",
          "Los socios comerciales, clubes, deportistas y organismos públicos reciben la misma revisión factual que cualquier lector. El patrocinio o el acceso no crean ningún derecho a alterar un reportaje exacto.",
        ],
      },
    ],
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { alternates: pageAlternates("/corrections"), title: copy.metaTitle, description: copy.metaDescription };
}

export default function CorrectionsPage() {
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
