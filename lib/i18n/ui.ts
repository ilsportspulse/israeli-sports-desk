import { defaultLocale, type LocaleCode } from "@/lib/locales";

// Hand-authored UI chrome strings for the public site. Journalistic register,
// pure sporting vocabulary (no machine-literal calques). English is canonical;
// fr/es are professional translations kept in lock-step with the English keys.
//
// Article *content* is translated per-article in data/content-translations.json;
// this dictionary covers navigation, section headings and standing labels only.

export type UiKey =
  | "nav.home"
  | "nav.israel"
  | "nav.israeliSport"
  | "nav.internationalSport"
  | "nav.quiz"
  | "nav.allStories"
  | "nav.football"
  | "nav.basketball"
  | "nav.abroad"
  | "nav.international"
  | "nav.archive"
  | "nav.columns"
  | "nav.about"
  | "nav.scores"
  | "nav.matchCenter"
  | "action.search"
  | "action.toggleTheme"
  | "action.openMenu"
  | "action.closeMenu"
  | "action.readMore"
  | "action.viewAll"
  | "label.latest"
  | "label.liveScores"
  | "label.liveUpcoming"
  | "label.fixtures"
  | "label.tables"
  | "label.topStory"
  | "label.language"
  | "label.skipToStories"
  | "label.translatedNote"
  | "label.originalEnglish"
  | "label.machineTranslated"
  | "label.backHome"
  | "label.published"
  | "label.updated"
  | "byline.sportsDesk"
  | "byline.column"
  | "byline.historyDesk"
  | "label.keyFacts"
  | "label.atAGlance"
  | "label.continueReading"
  | "label.fromTheDesk"
  | "label.corrections"
  | "section.latest"
  | "section.international"
  | "section.columns"
  | "section.archive";

type Dictionary = Record<UiKey, string>;

const en: Dictionary = {
  "nav.home": "Home",
  "nav.israel": "Israel",
  "nav.israeliSport": "Israeli Sport",
  "nav.internationalSport": "International Sport",
  "nav.quiz": "Quiz",
  "nav.allStories": "All stories",
  "nav.football": "Israeli football",
  "nav.basketball": "Basketball",
  "nav.abroad": "Israelis abroad",
  "nav.international": "International",
  "nav.archive": "Retro",
  "nav.columns": "Columns",
  "nav.about": "About",
  "nav.scores": "Scores",
  "nav.matchCenter": "Match Center",
  "action.search": "Search",
  "action.toggleTheme": "Toggle colour theme",
  "action.openMenu": "Open menu",
  "action.closeMenu": "Close menu",
  "action.readMore": "Read more",
  "action.viewAll": "View all",
  "label.latest": "Latest",
  "label.liveScores": "Live scores",
  "label.liveUpcoming": "Live & upcoming",
  "label.fixtures": "Fixtures",
  "label.tables": "Tables",
  "label.topStory": "Top story",
  "label.language": "Language",
  "label.skipToStories": "Skip to stories",
  "label.translatedNote": "Translated by the ILSP copy desk",
  "label.originalEnglish": "Read the original in English",
  "label.machineTranslated": "This article is not yet available in this language — showing the English original.",
  "label.backHome": "Back to the front page",
  "label.published": "Published",
  "label.updated": "Updated",
  "byline.sportsDesk": "By the ILSP Sports Desk",
  "byline.column": "ILSP Column · Sports Desk",
  "byline.historyDesk": "By the ILSP History Desk",
  "label.keyFacts": "Key facts",
  "label.atAGlance": "At a glance",
  "label.continueReading": "Continue reading",
  "label.fromTheDesk": "From the desk",
  "label.corrections": "Corrections",
  "section.latest": "Latest stories",
  "section.international": "International",
  "section.columns": "Columns",
  "section.archive": "From the archive",
};

const fr: Dictionary = {
  "nav.home": "Accueil",
  "nav.israel": "Israël",
  "nav.israeliSport": "Sport israélien",
  "nav.internationalSport": "Sport international",
  "nav.quiz": "Quiz",
  "nav.allStories": "Tous les articles",
  "nav.football": "Football israélien",
  "nav.basketball": "Basket-ball",
  "nav.abroad": "Israéliens à l'étranger",
  "nav.international": "International",
  "nav.archive": "Rétro",
  "nav.columns": "Chroniques",
  "nav.about": "À propos",
  "nav.scores": "Scores",
  "nav.matchCenter": "Match Center",
  "action.search": "Rechercher",
  "action.toggleTheme": "Changer de thème",
  "action.openMenu": "Ouvrir le menu",
  "action.closeMenu": "Fermer le menu",
  "action.readMore": "Lire la suite",
  "action.viewAll": "Tout voir",
  "label.latest": "À la une",
  "label.liveScores": "Scores en direct",
  "label.liveUpcoming": "En direct & à venir",
  "label.fixtures": "Calendrier",
  "label.tables": "Classements",
  "label.topStory": "À la une",
  "label.language": "Langue",
  "label.skipToStories": "Aller aux articles",
  "label.translatedNote": "Traduit par la rédaction d'ILSP",
  "label.originalEnglish": "Lire l'original en anglais",
  "label.machineTranslated": "Cet article n'est pas encore disponible dans cette langue — version anglaise affichée.",
  "label.backHome": "Retour à la une",
  "label.published": "Publié",
  "label.updated": "Mis à jour",
  "byline.sportsDesk": "Par la rédaction sportive d'ILSP",
  "byline.column": "Chronique ILSP · Rédaction sportive",
  "byline.historyDesk": "Par la rédaction Histoire d'ILSP",
  "label.keyFacts": "Faits marquants",
  "label.atAGlance": "En bref",
  "label.continueReading": "À lire aussi",
  "label.fromTheDesk": "Depuis la rédaction",
  "label.corrections": "Corrections",
  "section.latest": "Derniers articles",
  "section.international": "International",
  "section.columns": "Chroniques",
  "section.archive": "Depuis les archives",
};

const es: Dictionary = {
  "nav.home": "Inicio",
  "nav.israel": "Israel",
  "nav.israeliSport": "Deporte israelí",
  "nav.internationalSport": "Deporte internacional",
  "nav.quiz": "Quiz",
  "nav.allStories": "Todas las noticias",
  "nav.football": "Fútbol israelí",
  "nav.basketball": "Baloncesto",
  "nav.abroad": "Israelíes en el extranjero",
  "nav.international": "Internacional",
  "nav.archive": "Retro",
  "nav.columns": "Columnas",
  "nav.about": "Acerca de",
  "nav.scores": "Resultados",
  "nav.matchCenter": "Match Center",
  "action.search": "Buscar",
  "action.toggleTheme": "Cambiar de tema",
  "action.openMenu": "Abrir menú",
  "action.closeMenu": "Cerrar menú",
  "action.readMore": "Leer más",
  "action.viewAll": "Ver todo",
  "label.latest": "Última hora",
  "label.liveScores": "Resultados en directo",
  "label.liveUpcoming": "En directo y próximos",
  "label.fixtures": "Calendario",
  "label.tables": "Clasificaciones",
  "label.topStory": "Destacado",
  "label.language": "Idioma",
  "label.skipToStories": "Ir a las noticias",
  "label.translatedNote": "Traducido por la redacción de ILSP",
  "label.originalEnglish": "Leer el original en inglés",
  "label.machineTranslated": "Este artículo aún no está disponible en este idioma — se muestra el original en inglés.",
  "label.backHome": "Volver a la portada",
  "label.published": "Publicado",
  "label.updated": "Actualizado",
  "byline.sportsDesk": "Por la redacción deportiva de ILSP",
  "byline.column": "Columna ILSP · Redacción deportiva",
  "byline.historyDesk": "Por la redacción de Historia de ILSP",
  "label.keyFacts": "Datos clave",
  "label.atAGlance": "De un vistazo",
  "label.continueReading": "Seguir leyendo",
  "label.fromTheDesk": "Desde la redacción",
  "label.corrections": "Correcciones",
  "section.latest": "Últimas noticias",
  "section.international": "Internacional",
  "section.columns": "Columnas",
  "section.archive": "Desde el archivo",
};

const dictionaries: Record<LocaleCode, Dictionary> = { en, fr, es };

export function t(locale: LocaleCode, key: UiKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries[defaultLocale][key] ?? key;
}

/** Bind a translator to one locale for terse call sites. */
export function translator(locale: LocaleCode) {
  return (key: UiKey) => t(locale, key);
}
