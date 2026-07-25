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
  | "section.archive"
  | "nav.partners"
  | "aria.mainNav"
  | "aria.mobileMenu"
  | "aria.searchDialog"
  | "aria.chooseDesk"
  | "aria.filterStories"
  | "aria.moreInternational"
  | "aria.legalPolicies"
  | "aria.storyArchive"
  | "aria.switchCompetition"
  | "aria.competitionSections"
  | "label.latestHeadlines"
  | "action.closeSearch"
  | "search.eyebrow"
  | "search.title"
  | "search.placeholder"
  | "tab.israeliSport"
  | "section.theLatest"
  | "section.biggestGames"
  | "section.acrossIsraeliSport"
  | "label.stories"
  | "label.story"
  | "action.browseEvery"
  | "label.now"
  | "section.mostFollowed"
  | "section.allArchive"
  | "section.intlCorner"
  | "section.moreWorld"
  | "section.ilspColumns"
  | "columns.heading"
  | "columns.blurb"
  | "label.column"
  | "action.readColumn"
  | "action.viewAllColumns"
  | "newsletter.eyebrow"
  | "newsletter.title"
  | "newsletter.blurb"
  | "newsletter.emailLabel"
  | "newsletter.placeholder"
  | "newsletter.cta"
  | "footer.coverage"
  | "footer.data"
  | "footer.explore"
  | "label.fromArchive"
  | "footer.nameDesk"
  | "footer.whyIlsp"
  | "footer.privacy"
  | "footer.terms"
  | "footer.commercial"
  | "footer.tagline"
  | "label.backToDesk"
  | "action.readStory"
  | "label.tbc"
  | "label.sport"
  | "comp.overview"
  | "comp.matches"
  | "comp.standings"
  | "comp.stats"
  | "comp.noMatches"
  | "comp.noMatchesSub"
  | "comp.latestFrom"
  | "comp.team"
  | "comp.tableUnavailable"
  | "comp.tableUnavailableSub"
  | "comp.seasonStats"
  | "comp.topScorers"
  | "comp.topScorersSub"
  | "comp.assists"
  | "comp.assistsSub"
  | "comp.records"
  | "comp.recordsSub"
  | "article.officialReveal"
  | "article.publishedBy"
  | "article.openLaunchPost"
  | "article.watchArchive"
  | "article.uploadedBy"
  | "article.openYoutube"
  | "article.previewBanner"
  | "article.backToEditor"
  | "label.photo"
  | "label.visual";

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
  "nav.partners": "Partners",
  "aria.mainNav": "Main navigation",
  "aria.mobileMenu": "Mobile menu",
  "aria.searchDialog": "Search stories",
  "aria.chooseDesk": "Choose desk",
  "aria.filterStories": "Filter stories",
  "aria.moreInternational": "More international",
  "aria.legalPolicies": "Editorial and legal policies",
  "aria.storyArchive": "Story archive",
  "aria.switchCompetition": "Switch competition",
  "aria.competitionSections": "Competition sections",
  "label.latestHeadlines": "Latest headlines",
  "action.closeSearch": "Close search",
  "search.eyebrow": "Search the desk",
  "search.title": "What are you following?",
  "search.placeholder": "Team, player or competition…",
  "tab.israeliSport": "Israeli sport",
  "section.theLatest": "The latest",
  "section.biggestGames": "The world’s biggest games",
  "section.acrossIsraeliSport": "Across Israeli sport",
  "label.stories": "stories",
  "label.story": "story",
  "action.browseEvery": "Browse every story",
  "label.now": "Now",
  "section.mostFollowed": "Most followed",
  "section.allArchive": "All Retro",
  "section.intlCorner": "International corner",
  "section.moreWorld": "More from around the world",
  "section.ilspColumns": "ILSP Columns",
  "columns.heading": "Arguments worth having",
  "columns.blurb": "Tactical context, sharp arguments and the Israeli angle behind the day’s biggest decisions.",
  "label.column": "Column",
  "action.readColumn": "Read column",
  "action.viewAllColumns": "View every ILSP column",
  "newsletter.eyebrow": "The morning read",
  "newsletter.title": "Israeli sport, translated into context.",
  "newsletter.blurb": "A crisp English briefing with the scores, decisive moments and what happens next.",
  "newsletter.emailLabel": "Email address",
  "newsletter.placeholder": "you@example.com",
  "newsletter.cta": "Join the list",
  "footer.coverage": "Coverage",
  "footer.data": "Data",
  "footer.explore": "Explore",
  "label.fromArchive": "From the Archive",
  "footer.nameDesk": "Name desk",
  "footer.whyIlsp": "Why ILSP exists",
  "footer.privacy": "Privacy",
  "footer.terms": "Terms",
  "footer.commercial": "Commercial independence",
  "footer.tagline": "Israeli sport in English.",
  "label.backToDesk": "Back to the desk",
  "action.readStory": "Read story",
  "label.tbc": "TBC",
  "label.sport": "Sport",
  "comp.overview": "Overview",
  "comp.matches": "Matches",
  "comp.standings": "Standings",
  "comp.stats": "Stats",
  "comp.noMatches": "No matches scheduled right now",
  "comp.noMatchesSub": "Fixtures appear here as soon as the data feed lists them.",
  "comp.latestFrom": "Latest from this competition",
  "comp.team": "Team",
  "comp.tableUnavailable": "Table not published",
  "comp.tableUnavailableSub": "The standings appear when the licensed feed supplies them.",
  "comp.seasonStats": "Season stats",
  "comp.topScorers": "Top scorers",
  "comp.topScorersSub": "Goal, assist and discipline leaders populate automatically when the licensed stats feed supplies them — never estimated by ILSP.",
  "comp.assists": "Assists",
  "comp.assistsSub": "Awaiting the licensed player-stats feed for this competition.",
  "comp.records": "Records & more",
  "comp.recordsSub": "Clean sheets, cards and xG will be shown here when available.",
  "article.officialReveal": "Official club reveal",
  "article.publishedBy": "Published by",
  "article.openLaunchPost": "Open the official launch post",
  "article.watchArchive": "Watch the archive",
  "article.uploadedBy": "Uploaded by",
  "article.openYoutube": "Open on YouTube",
  "article.previewBanner": "Preview — this article is in review and not visible to the public.",
  "article.backToEditor": "Back to editor",
  "label.photo": "Photo: ",
  "label.visual": "Visual: ",
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
  "nav.partners": "Partenaires",
  "aria.mainNav": "Navigation principale",
  "aria.mobileMenu": "Menu mobile",
  "aria.searchDialog": "Rechercher des articles",
  "aria.chooseDesk": "Choisir la rubrique",
  "aria.filterStories": "Filtrer les articles",
  "aria.moreInternational": "Plus d’actualités internationales",
  "aria.legalPolicies": "Politiques éditoriales et légales",
  "aria.storyArchive": "Archives des articles",
  "aria.switchCompetition": "Changer de compétition",
  "aria.competitionSections": "Sections de la compétition",
  "label.latestHeadlines": "Derniers titres",
  "action.closeSearch": "Fermer la recherche",
  "search.eyebrow": "Rechercher dans la rédaction",
  "search.title": "Que suivez-vous ?",
  "search.placeholder": "Équipe, joueur ou compétition…",
  "tab.israeliSport": "Sport israélien",
  "section.theLatest": "À la une",
  "section.biggestGames": "Les plus grands matchs du monde",
  "section.acrossIsraeliSport": "Tout le sport israélien",
  "label.stories": "articles",
  "label.story": "article",
  "action.browseEvery": "Parcourir tous les articles",
  "label.now": "Maintenant",
  "section.mostFollowed": "Les plus suivis",
  "section.allArchive": "Tout le Rétro",
  "section.intlCorner": "Coin international",
  "section.moreWorld": "Plus d’actualités du monde",
  "section.ilspColumns": "Chroniques ILSP",
  "columns.heading": "Des débats qui comptent",
  "columns.blurb": "Contexte tactique, arguments tranchés et l’angle israélien derrière les grandes décisions du jour.",
  "label.column": "Chronique",
  "action.readColumn": "Lire la chronique",
  "action.viewAllColumns": "Voir toutes les chroniques ILSP",
  "newsletter.eyebrow": "La lecture du matin",
  "newsletter.title": "Le sport israélien, remis en contexte.",
  "newsletter.blurb": "Un briefing clair avec les scores, les moments décisifs et la suite des événements.",
  "newsletter.emailLabel": "Adresse e-mail",
  "newsletter.placeholder": "vous@exemple.com",
  "newsletter.cta": "Rejoindre la liste",
  "footer.coverage": "Couverture",
  "footer.data": "Données",
  "footer.explore": "Explorer",
  "label.fromArchive": "Depuis les archives",
  "footer.nameDesk": "Rubrique des noms",
  "footer.whyIlsp": "Pourquoi ILSP existe",
  "footer.privacy": "Confidentialité",
  "footer.terms": "Conditions",
  "footer.commercial": "Indépendance commerciale",
  "footer.tagline": "Le sport israélien en anglais.",
  "label.backToDesk": "Retour à la rédaction",
  "action.readStory": "Lire l’article",
  "label.tbc": "À confirmer",
  "label.sport": "Sport",
  "comp.overview": "Aperçu",
  "comp.matches": "Matchs",
  "comp.standings": "Classement",
  "comp.stats": "Stats",
  "comp.noMatches": "Aucun match programmé pour le moment",
  "comp.noMatchesSub": "Les matchs apparaissent ici dès que le flux de données les répertorie.",
  "comp.latestFrom": "Dernières actus de cette compétition",
  "comp.team": "Équipe",
  "comp.tableUnavailable": "Classement non publié",
  "comp.tableUnavailableSub": "Le classement apparaît lorsque le flux sous licence le fournit.",
  "comp.seasonStats": "Statistiques de la saison",
  "comp.topScorers": "Meilleurs buteurs",
  "comp.topScorersSub": "Les leaders aux buts, passes décisives et discipline s’affichent automatiquement lorsque le flux statistique sous licence les fournit — jamais estimés par ILSP.",
  "comp.assists": "Passes décisives",
  "comp.assistsSub": "En attente du flux statistique des joueurs sous licence pour cette compétition.",
  "comp.records": "Records et plus",
  "comp.recordsSub": "Les clean sheets, cartons et xG seront affichés ici lorsqu’ils seront disponibles.",
  "article.officialReveal": "Annonce officielle du club",
  "article.publishedBy": "Publié par",
  "article.openLaunchPost": "Ouvrir la publication officielle",
  "article.watchArchive": "Voir les archives",
  "article.uploadedBy": "Mis en ligne par",
  "article.openYoutube": "Ouvrir sur YouTube",
  "article.previewBanner": "Aperçu — cet article est en cours de révision et n’est pas visible du public.",
  "article.backToEditor": "Retour à l’éditeur",
  "label.photo": "Photo : ",
  "label.visual": "Visuel : ",
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
  "nav.partners": "Socios",
  "aria.mainNav": "Navegación principal",
  "aria.mobileMenu": "Menú móvil",
  "aria.searchDialog": "Buscar noticias",
  "aria.chooseDesk": "Elegir sección",
  "aria.filterStories": "Filtrar noticias",
  "aria.moreInternational": "Más internacional",
  "aria.legalPolicies": "Políticas editoriales y legales",
  "aria.storyArchive": "Archivo de noticias",
  "aria.switchCompetition": "Cambiar de competición",
  "aria.competitionSections": "Secciones de la competición",
  "label.latestHeadlines": "Últimos titulares",
  "action.closeSearch": "Cerrar búsqueda",
  "search.eyebrow": "Buscar en la redacción",
  "search.title": "¿Qué estás siguiendo?",
  "search.placeholder": "Equipo, jugador o competición…",
  "tab.israeliSport": "Deporte israelí",
  "section.theLatest": "Lo último",
  "section.biggestGames": "Los partidos más grandes del mundo",
  "section.acrossIsraeliSport": "Todo el deporte israelí",
  "label.stories": "noticias",
  "label.story": "noticia",
  "action.browseEvery": "Ver todas las noticias",
  "label.now": "Ahora",
  "section.mostFollowed": "Lo más seguido",
  "section.allArchive": "Todo Retro",
  "section.intlCorner": "Rincón internacional",
  "section.moreWorld": "Más noticias del mundo",
  "section.ilspColumns": "Columnas ILSP",
  "columns.heading": "Debates que merecen la pena",
  "columns.blurb": "Contexto táctico, argumentos afilados y el ángulo israelí tras las grandes decisiones del día.",
  "label.column": "Columna",
  "action.readColumn": "Leer columna",
  "action.viewAllColumns": "Ver todas las columnas de ILSP",
  "newsletter.eyebrow": "La lectura de la mañana",
  "newsletter.title": "El deporte israelí, con todo su contexto.",
  "newsletter.blurb": "Un resumen claro con los resultados, los momentos decisivos y lo que viene después.",
  "newsletter.emailLabel": "Correo electrónico",
  "newsletter.placeholder": "tu@ejemplo.com",
  "newsletter.cta": "Unirse a la lista",
  "footer.coverage": "Cobertura",
  "footer.data": "Datos",
  "footer.explore": "Explorar",
  "label.fromArchive": "Desde el archivo",
  "footer.nameDesk": "Sección de nombres",
  "footer.whyIlsp": "Por qué existe ILSP",
  "footer.privacy": "Privacidad",
  "footer.terms": "Términos",
  "footer.commercial": "Independencia comercial",
  "footer.tagline": "El deporte israelí en inglés.",
  "label.backToDesk": "Volver a la redacción",
  "action.readStory": "Leer noticia",
  "label.tbc": "Por confirmar",
  "label.sport": "Deporte",
  "comp.overview": "Resumen",
  "comp.matches": "Partidos",
  "comp.standings": "Clasificación",
  "comp.stats": "Estadísticas",
  "comp.noMatches": "No hay partidos programados ahora mismo",
  "comp.noMatchesSub": "Los partidos aparecen aquí en cuanto el proveedor de datos los publica.",
  "comp.latestFrom": "Lo último de esta competición",
  "comp.team": "Equipo",
  "comp.tableUnavailable": "Clasificación no publicada",
  "comp.tableUnavailableSub": "La clasificación aparece cuando el proveedor con licencia la facilita.",
  "comp.seasonStats": "Estadísticas de la temporada",
  "comp.topScorers": "Máximos goleadores",
  "comp.topScorersSub": "Los líderes en goles, asistencias y disciplina se muestran automáticamente cuando el proveedor de estadísticas con licencia los facilita, nunca estimados por ILSP.",
  "comp.assists": "Asistencias",
  "comp.assistsSub": "A la espera del proveedor de estadísticas de jugadores con licencia para esta competición.",
  "comp.records": "Récords y más",
  "comp.recordsSub": "Las porterías a cero, tarjetas y xG se mostrarán aquí cuando estén disponibles.",
  "article.officialReveal": "Anuncio oficial del club",
  "article.publishedBy": "Publicado por",
  "article.openLaunchPost": "Abrir la publicación oficial",
  "article.watchArchive": "Ver el archivo",
  "article.uploadedBy": "Subido por",
  "article.openYoutube": "Abrir en YouTube",
  "article.previewBanner": "Vista previa — este artículo está en revisión y no es visible para el público.",
  "article.backToEditor": "Volver al editor",
  "label.photo": "Foto: ",
  "label.visual": "Ilustración: ",
};

const dictionaries: Record<LocaleCode, Dictionary> = { en, fr, es };

export function t(locale: LocaleCode, key: UiKey): string {
  return dictionaries[locale]?.[key] ?? dictionaries[defaultLocale][key] ?? key;
}

/** Bind a translator to one locale for terse call sites. */
export function translator(locale: LocaleCode) {
  return (key: UiKey) => t(locale, key);
}
