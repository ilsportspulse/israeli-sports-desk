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
    metaTitle: "Privacy policy",
    metaDescription: "How Israel Sports Pulse handles reader information and service data.",
    eyebrow: "Reader privacy",
    title: "Useful data, collected with restraint.",
    introduction: "ILSP is designed to inform readers, not to build unnecessary personal profiles. We collect only information needed to operate, secure and improve the service or to provide something a reader has requested.",
    updated: "16 July 2026",
    sections: [
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
    ],
  },
  fr: {
    metaTitle: "Politique de confidentialité",
    metaDescription: "Comment Israel Sports Pulse traite les informations des lecteurs et les données du service.",
    eyebrow: "Confidentialité des lecteurs",
    title: "Des données utiles, collectées avec mesure.",
    introduction: "ILSP est conçu pour informer les lecteurs, non pour constituer des profils personnels inutiles. Nous ne collectons que les informations nécessaires pour exploiter, sécuriser et améliorer le service, ou pour fournir ce qu’un lecteur a demandé.",
    updated: "16 juillet 2026",
    sections: [
      {
        title: "Informations que nous pouvons recevoir",
        items: [
          "Des données techniques telles que l’adresse IP, les informations sur l’appareil et le navigateur, les pages demandées, les horodatages et les événements de sécurité.",
          "Les coordonnées qu’un lecteur choisit de fournir pour les newsletters, les demandes de correction, les fonctions de compte ou une correspondance directe.",
          "Les informations de préférence et d’engagement nécessaires pour mémoriser les réglages ou comprendre la performance globale du produit.",
        ],
      },
      {
        title: "Comment les informations sont utilisées",
        paragraphs: [
          "Nous utilisons les informations pour afficher les pages et les communications demandées, protéger le service, diagnostiquer les pannes, mesurer l’audience de manière agrégée et respecter nos obligations légales. Nous ne vendons pas d’informations personnelles. La mesure publicitaire ou de parrainage ne doit pas donner à un partenaire accès aux archives éditoriales d’ILSP ni à des données de lecteurs identifiables, sauf si un lecteur a clairement consenti à un service précis.",
        ],
      },
      {
        title: "Conservation, partage et choix",
        paragraphs: [
          "Des prestataires peuvent traiter des informations limitées pour le compte d’ILSP à des fins d’hébergement, de sécurité, d’analyse, d’envoi d’e-mails ou d’autres opérations nécessaires. Ils sont tenus de les utiliser uniquement dans le cadre convenu et de les protéger de façon appropriée. Des informations peuvent aussi être divulguées lorsque la loi l’exige ou pour défendre la sécurité et l’intégrité du service.",
          "Les lecteurs peuvent demander l’accès, la correction ou la suppression de leurs informations personnelles, sous réserve des obligations légales et d’archivage journalistique, en écrivant à privacy@ilsportspulse.com. Les messages de newsletter incluront un moyen de désabonnement lorsque ce service sera actif.",
        ],
      },
      {
        title: "Matériel journalistique",
        paragraphs: [
          "Les demandes de confidentialité portant sur du journalisme publié sont évaluées séparément des données de compte ordinaires. Le reportage d’intérêt public, la protection des sources, la liberté d’expression et l’intégrité des archives historiques peuvent exiger la conservation d’informations, même lorsque d’autres données de service peuvent être supprimées.",
        ],
      },
    ],
  },
  es: {
    metaTitle: "Política de privacidad",
    metaDescription: "Cómo Israel Sports Pulse gestiona la información de los lectores y los datos del servicio.",
    eyebrow: "Privacidad del lector",
    title: "Datos útiles, recopilados con moderación.",
    introduction: "ILSP está diseñado para informar a los lectores, no para crear perfiles personales innecesarios. Solo recopilamos la información necesaria para operar, proteger y mejorar el servicio o para ofrecer algo que un lector haya solicitado.",
    updated: "16 de julio de 2026",
    sections: [
      {
        title: "Información que podemos recibir",
        items: [
          "Registros técnicos como la dirección IP, información del dispositivo y del navegador, páginas solicitadas, marcas de tiempo y eventos de seguridad.",
          "Datos de contacto que un lector decide facilitar para newsletters, solicitudes de corrección, funciones de cuenta o correspondencia directa.",
          "Información de preferencias y de interacción necesaria para recordar ajustes o comprender el rendimiento agregado del producto.",
        ],
      },
      {
        title: "Cómo se utiliza la información",
        paragraphs: [
          "Utilizamos la información para mostrar páginas y comunicaciones solicitadas, proteger el servicio, diagnosticar fallos, medir el rendimiento de la audiencia de forma agregada y cumplir obligaciones legales. No vendemos información personal. La medición de publicidad o de patrocinio no debe dar a un socio acceso a los registros editoriales de ILSP ni a datos identificables de lectores, salvo que un lector haya consentido claramente a un servicio concreto.",
        ],
      },
      {
        title: "Almacenamiento, uso compartido y opciones",
        paragraphs: [
          "Los proveedores de servicios pueden procesar información limitada en nombre de ILSP para alojamiento, seguridad, analítica, envío de correo u otras operaciones necesarias. Se espera que la utilicen únicamente para el fin contratado y que la protejan de forma adecuada. La información también puede divulgarse cuando lo exija la ley o para defender la seguridad e integridad del servicio.",
          "Los lectores pueden solicitar el acceso, la corrección o la eliminación de su información personal, con sujeción a las obligaciones legales y de archivo periodístico, escribiendo a privacy@ilsportspulse.com. Los mensajes de newsletter incluirán una vía de baja cuando ese servicio esté activo.",
        ],
      },
      {
        title: "Material periodístico",
        paragraphs: [
          "Las solicitudes de privacidad relativas a periodismo publicado se evalúan por separado de los datos de cuenta ordinarios. El periodismo de interés público, la protección de las fuentes, la libertad de expresión y la integridad del archivo histórico pueden exigir conservar información, incluso cuando otros datos del servicio puedan eliminarse.",
        ],
      },
    ],
  },
};

export function generateMetadata(): Metadata {
  const copy = COPY[getRequestLocale()] ?? COPY.en;
  return { alternates: pageAlternates("/privacy"), title: copy.metaTitle, description: copy.metaDescription };
}

export default function PrivacyPage() {
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
