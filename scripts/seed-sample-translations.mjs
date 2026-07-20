#!/usr/bin/env node
// One-off seed of hand-authored, copy-desk-quality FR/ES translations for the
// newest stories, so the multilingual site ships with real localized content
// (not just the labelled English fallback). The autonomous newsroom translation
// step (scripts/translate-articles.mjs) keeps every other story in sync.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ARTICLES = path.join(root, "data", "articles.json");
const TRANSLATIONS = path.join(root, "data", "content-translations.json");

const records = [
  {
    articleId: "live-20260720-afriyie-injury",
    locale: "fr",
    title: "Blessing Afrifah, recordman israélien du 100 m, déclare forfait aux championnats nationaux sur blessure aux ischio-jambiers",
    dek: "Le sprinteur le plus rapide d'Israël est retiré au dernier moment du 100 m et du 200 m à Jérusalem, son équipe préservant sa condition en vue des Championnats d'Europe le mois prochain à Birmingham.",
    category: "Sport olympique israélien",
    body: [
      "Blessing Afrifah, le sprinteur qui détient le record national israélien du 100 m, a été retiré au dernier moment du 100 m et du 200 m des championnats nationaux d'athlétisme à Jérusalem, à la suite d'une blessure aux ischio-jambiers.",
      "Selon l'information, Afrifah, gêné par les ischio-jambiers depuis plusieurs semaines, a été rayé des listes d'engagés peu avant la réunion du stade de Givat Ram, le staff médical jugeant plus prudent de le ménager que de risquer d'aggraver le muscle.",
      "Afrifah est l'homme le plus rapide qu'Israël ait produit. Il a établi le record national du 100 m en 10 s 09 à Jérusalem en juillet 2025, effaçant une marque qui tenait depuis plus de deux décennies, et il détient également le record national du 200 m en 19 s 96, couru alors qu'il était adolescent en 2022.",
      "Aujourd'hui âgé de 22 ans, il a remporté le 200 m aux Championnats du monde juniors 2022 et décroché le titre européen des moins de 23 ans en 2023 comme en 2025 ; il était le tenant du titre dans les deux sprints à ces championnats nationaux.",
      "La décision de le préserver tient au calendrier : selon l'information, les Championnats d'Europe d'athlétisme de Birmingham ne sont plus qu'à un mois environ, et son équipe a préféré protéger sa condition en vue de l'échéance continentale plutôt que de courir après les titres nationaux.",
      "Ce forfait intervient sur un week-end déjà lourd de sens pour l'athlétisme israélien, puisqu'il coïncide avec la fin de la carrière du recordman du décathlon Ariel Atias, dont la retraite a été relatée séparément par notre rédaction.",
      "Aucune date de retour n'a été communiquée et, pour l'heure, le forfait repose sur une seule source israélienne ; son état à l'approche de Birmingham constituera sans doute l'indicateur le plus révélateur de la gravité réelle de la blessure.",
    ],
    facts: [
      "Blessing Afrifah a été retiré au dernier moment du 100 m et du 200 m des Championnats d'Israël d'athlétisme à Jérusalem (Givat Ram) sur une blessure aux ischio-jambiers, selon la source.",
      "La gêne aux ischio-jambiers le perturbait depuis plusieurs semaines, et le staff médical a choisi de le ménager plutôt que de risquer une aggravation.",
      "Afrifah détient le record national israélien du 100 m en 10 s 09, établi à Jérusalem en juillet 2025 — le meilleur temps jamais réalisé par un Israélien (World Athletics).",
      "Il détient aussi le record national du 200 m en 19 s 96 (2022) et a été champion du 200 m aux Championnats du monde juniors 2022 ainsi qu'aux Championnats d'Europe des moins de 23 ans 2023 et 2025.",
      "Le forfait vise à préserver sa condition pour les Championnats d'Europe d'athlétisme de Birmingham, situés à environ un mois selon l'information.",
      "Le même week-end a marqué la retraite du recordman du décathlon Ariel Atias, traitée séparément par notre rédaction.",
    ],
    media: {
      alt: "Blessing Afrifah, recordman israélien du 100 m, déclare forfait aux championnats nationaux sur blessure aux ischio-jambiers",
      caption: "Le sprinteur le plus rapide d'Israël est retiré au dernier moment du 100 m et du 200 m à Jérusalem, son équipe préservant sa condition en vue des Championnats d'Europe le mois prochain à Birmingham.",
    },
  },
  {
    articleId: "live-20260720-afriyie-injury",
    locale: "es",
    title: "Blessing Afrifah, plusmarquista israelí de los 100 m, se retira del campeonato nacional por una lesión en el isquiotibial",
    dek: "El velocista más rápido de Israel es retirado a última hora de los 100 m y los 200 m en Jerusalén, mientras su equipo cuida su estado de forma de cara al Campeonato de Europa del próximo mes en Birmingham.",
    category: "Deporte olímpico israelí",
    body: [
      "Blessing Afrifah, el velocista que posee el récord nacional israelí de los 100 m, ha sido retirado a última hora tanto de los 100 m como de los 200 m del campeonato nacional de atletismo en Jerusalén, tras una lesión en el isquiotibial.",
      "Según la información, Afrifah, con molestias en el isquiotibial desde hacía varias semanas, fue borrado de las listas de inscritos poco antes de la reunión del estadio de Givat Ram, al considerar el cuerpo médico más seguro reservarlo que arriesgarse a agravar el músculo.",
      "Afrifah es el hombre más rápido que ha dado Israel. Estableció el récord nacional de los 100 m con 10,09 segundos en Jerusalén en julio de 2025, borrando una marca que resistía desde hacía más de dos décadas, y también posee el récord nacional de los 200 m con 19,96, corrido siendo adolescente en 2022.",
      "Con 22 años, ganó los 200 m en el Campeonato del Mundo sub-20 de 2022 y se llevó el título europeo sub-23 tanto en 2023 como en 2025; llegaba como campeón defensor en ambas pruebas de velocidad de este campeonato nacional.",
      "La decisión de reservarlo está ligada al calendario: según la información, el Campeonato de Europa de atletismo de Birmingham está a apenas un mes, y su equipo prefirió proteger su estado de forma para la cita continental antes que perseguir títulos nacionales en casa.",
      "La retirada llega además en un fin de semana ya cargado de significado para el atletismo israelí, pues coincide con el final de la carrera del plusmarquista de decatlón Ariel Atias, cuya retirada informó por separado esta redacción.",
      "No se ha dado fecha de regreso y, por ahora, la baja se apoya en un único informe israelí; su estado en la antesala de Birmingham será probablemente la medida más reveladora de la gravedad real de la lesión.",
    ],
    facts: [
      "Blessing Afrifah fue retirado a última hora de los 100 m y los 200 m del Campeonato de Israel de atletismo en Jerusalén (Givat Ram) por una lesión en el isquiotibial, según la fuente.",
      "La molestia en el isquiotibial lo aquejaba desde hacía varias semanas, y el cuerpo médico optó por reservarlo en lugar de arriesgar un daño mayor.",
      "Afrifah posee el récord nacional israelí de los 100 m con 10,09 segundos, establecido en Jerusalén en julio de 2025, el mejor registro jamás corrido por un israelí (World Athletics).",
      "También posee el récord nacional de los 200 m con 19,96 (2022) y fue campeón de los 200 m en el Mundial sub-20 de 2022 y en los Campeonatos de Europa sub-23 de 2023 y 2025.",
      "La baja busca preservar su estado de forma para el Campeonato de Europa de atletismo de Birmingham, que la información sitúa a aproximadamente un mes.",
      "El mismo fin de semana marcó la retirada del plusmarquista de decatlón Ariel Atias, cubierta por separado por esta redacción.",
    ],
    media: {
      alt: "Blessing Afrifah, plusmarquista israelí de los 100 m, se retira del campeonato nacional por una lesión en el isquiotibial",
      caption: "El velocista más rápido de Israel es retirado a última hora de los 100 m y los 200 m en Jerusalén, mientras su equipo cuida su estado de forma de cara al Campeonato de Europa del próximo mes en Birmingham.",
    },
  },
  {
    articleId: "live-20260719-dowtin-napoli",
    locale: "fr",
    title: "Jeff Dowtin Jr, ex-meneur du Maccabi Tel-Aviv, signe au Napoli Basket",
    dek: "Le meneur américain, qui avait quitté le Maccabi Tel-Aviv avant la fin de la saison puis discuté avec l'AEK Athènes, a été officiellement présenté à Naples en vue de l'EuroCup de la saison prochaine.",
    category: "Basket-ball mondial",
    body: [
      "Jeff Dowtin Jr, le meneur américain dont l'unique saison au Maccabi Tel-Aviv s'est achevée par une séparation anticipée, met le cap sur l'Italie. Le Napoli Basket a officiellement annoncé sa signature pour 2026-2027 lundi, confirmant un transfert que les médias israéliens et italiens donnaient pour acté la veille au soir.",
      "Ce transfert met un terme à un été d'incertitude pour le joueur de 29 ans, qui était en négociations avec l'AEK Athènes avant que cette piste ne se referme. C'est Naples, et non Athènes, qui accueillera désormais sa deuxième saison européenne.",
      "Dowtin était arrivé à Tel-Aviv en août 2025 pour un contrat de trois ans, sa première expérience hors d'Amérique du Nord après des passages en NBA à Golden State, Milwaukee, Orlando, Toronto et Philadelphie.",
      "Ses statistiques en jaune et bleu furent honorables plus que dominatrices : 9,6 points et 4,3 passes décisives en une vingtaine de minutes par match en championnat, et 8,1 points pour 2,4 passes en un peu plus de 17 minutes par soir en EuroLeague.",
      "Cela n'a pas suffi à mener le contrat à son terme. Le Maccabi et Dowtin se sont entendus pour se séparer en mai, avant la fin de la saison, et le meneur est revenu sur le marché.",
      "Naples représente un point de chute ambitieux. Le club de Serie A retrouve la scène européenne pour la première fois depuis près de vingt ans et a hérité d'un groupe d'EuroCup comprenant notamment Bourg-en-Bresse, Tofas Bursa, Buducnost et Trente.",
      "Pour Dowtin, l'EuroCup offre une scène d'un cran en dessous des soirées d'EuroLeague qu'il a connues à Tel-Aviv — et la chance de diriger sa propre équipe dans une ville qui redécouvre son appétit pour le basket.",
    ],
    facts: [
      "Jeff Dowtin Jr, 29 ans, est un meneur américain d'1,91 m né le 10 mai 1997 à Upper Marlboro, dans le Maryland ; il a évolué à l'université de Rhode Island.",
      "Il a disputé la NBA avec Golden State, Milwaukee, Orlando, Toronto et Philadelphie avant de rejoindre l'Europe.",
      "Il avait signé un contrat de trois ans avec le Maccabi Tel-Aviv en août 2025, mais le club s'est accordé pour se séparer de lui le 12 mai 2026, avant la fin de la saison.",
      "Au Maccabi, il tournait à 9,6 points et 4,3 passes décisives en championnat, et à 8,1 points et 2,4 passes en environ 17 minutes par match en EuroLeague.",
      "Il a négocié avec l'AEK Athènes cet été avant que le transfert à Naples ne se concrétise.",
      "Le Napoli Basket a officiellement annoncé la signature de Dowtin le 20 juillet 2026 ; le club dispute l'EuroCup 2026-2027, sa première campagne européenne depuis près de 20 ans.",
    ],
    media: {
      alt: "Jeff Dowtin Jr, ex-meneur du Maccabi Tel-Aviv, signe au Napoli Basket",
      caption: "Le meneur américain, qui avait quitté le Maccabi Tel-Aviv avant la fin de la saison puis discuté avec l'AEK Athènes, a été officiellement présenté à Naples en vue de l'EuroCup de la saison prochaine.",
    },
  },
  {
    articleId: "live-20260719-dowtin-napoli",
    locale: "es",
    title: "Jeff Dowtin Jr, ex base del Maccabi Tel Aviv, ficha por el Napoli Basket",
    dek: "El base estadounidense, que dejó el Maccabi Tel Aviv antes de que terminara la temporada y luego negoció con el AEK de Atenas, ha sido presentado oficialmente en Nápoles de cara a la EuroCup de la próxima temporada.",
    category: "Baloncesto mundial",
    body: [
      "Jeff Dowtin Jr, el base estadounidense cuya única temporada en el Maccabi Tel Aviv terminó con una separación anticipada, pone rumbo a Italia. El Napoli Basket anunció oficialmente su fichaje para 2026-27 el lunes, confirmando un movimiento que la prensa israelí e italiana daba por cerrado la noche anterior.",
      "El traspaso zanja un verano de incertidumbre para el jugador de 29 años, que había negociado con el AEK de Atenas antes de que esa vía se cerrara. Nápoles, y no Atenas, acogerá ahora su segunda temporada europea.",
      "Dowtin llegó a Tel Aviv en agosto de 2025 con un contrato de tres años, su primera experiencia fuera de Norteamérica tras sus etapas en la NBA con Golden State, Milwaukee, Orlando, Toronto y Filadelfia.",
      "Sus números de amarillo y azul fueron correctos más que determinantes: 9,6 puntos y 4,3 asistencias en unos 21 minutos por partido en la liga, y 8,1 puntos con 2,4 asistencias en algo más de 17 minutos por noche en la Euroliga.",
      "No bastó para cumplir el contrato. El Maccabi y Dowtin acordaron separarse en mayo, antes de que acabara la temporada, y el base volvió al mercado.",
      "Nápoles supone un destino ambicioso. El club de la Serie A regresa a la competición europea por primera vez en casi dos décadas y ha quedado encuadrado en un grupo de EuroCup con Bourg-en-Bresse, Tofas Bursa, Buducnost y Trento, entre otros.",
      "Para Dowtin, la EuroCup ofrece un escenario un peldaño por debajo de las noches de Euroliga que conoció en Tel Aviv, y la oportunidad de dirigir su propio equipo en una ciudad que redescubre su afición por el baloncesto.",
    ],
    facts: [
      "Jeff Dowtin Jr, de 29 años, es un base estadounidense de 1,91 m nacido el 10 de mayo de 1997 en Upper Marlboro, Maryland; jugó en la universidad de Rhode Island.",
      "Disputó la NBA con Golden State, Milwaukee, Orlando, Toronto y Filadelfia antes de dar el salto a Europa.",
      "Firmó un contrato de tres años con el Maccabi Tel Aviv en agosto de 2025, pero el club acordó separarse de él el 12 de mayo de 2026, antes de que terminara la temporada.",
      "En el Maccabi promedió 9,6 puntos y 4,3 asistencias en la liga, y 8,1 puntos y 2,4 asistencias en unos 17 minutos por partido en la Euroliga.",
      "Negoció con el AEK de Atenas este verano antes de que se materializara el fichaje por Nápoles.",
      "El Napoli Basket anunció oficialmente el fichaje de Dowtin el 20 de julio de 2026; el club disputa la EuroCup 2026-27, su primera campaña europea en casi 20 años.",
    ],
    media: {
      alt: "Jeff Dowtin Jr, ex base del Maccabi Tel Aviv, ficha por el Napoli Basket",
      caption: "El base estadounidense, que dejó el Maccabi Tel Aviv antes de que terminara la temporada y luego negoció con el AEK de Atenas, ha sido presentado oficialmente en Nápoles de cara a la EuroCup de la próxima temporada.",
    },
  },
  {
    articleId: "live-20260719-kangwa-aek-offer",
    locale: "fr",
    title: "L'AEK Athènes soumet une offre officielle pour Kings Kangwa, la star de l'Hapoël Beer-Sheva",
    dek: "Le club grec a formulé une offre en bonne et due forme pour le milieu zambien qui a porté Beer-Sheva au titre, mais la somme évoquée, supérieure à 2,5 millions d'euros, reste bien en deçà des plus de 4 millions réclamés par les champions.",
    category: "Football israélien",
    body: [
      "L'AEK Athènes a soumis une offre officielle à l'Hapoël Beer-Sheva pour Kings Kangwa, le milieu international zambien qui a mené le club au titre de champion d'Israël la saison dernière. La nouvelle de cette offre formelle a filtré en Israël dimanche soir, deux sources distinctes confirmant que les négociations entre les clubs sont désormais engagées et que la proposition grecque est la plus consistante reçue à ce jour pour le joueur de 27 ans.",
      "Les montants, toutefois, ne suffisent pas encore à conclure. L'offre actuelle de l'AEK dépasserait 2,5 millions d'euros, tandis que Beer-Sheva valorise son joueur de la saison à plus de 4 millions. Une estimation en Israël veut qu'une offre de l'ordre de 3 millions pourrait amener le club de la propriétaire Alona Barkat à la table des négociations, même si, en l'état, la proposition reste inférieure à ses exigences.",
      "Sur le plan des conditions personnelles, l'écart est bien plus facile à combler. Selon une source, l'AEK serait prêt à verser à Kangwa environ 700 000 euros par an, soit plus du double des quelque 300 000 euros qu'il perçoit actuellement dans le Néguev — le type d'augmentation salariale qui a tendance à faire réfléchir un joueur dès que les clubs commencent à discuter.",
      "Kangwa est arrivé à Beer-Sheva à l'été 2024 en provenance de l'Étoile rouge de Belgrade, où il avait remporté un titre de champion de Serbie et goûté à la Ligue des champions, pour un montant évalué à moins d'un million d'euros. L'investissement a été remboursé au centuple : 14 buts et 8 passes décisives lors de sa première saison, puis 12 buts et 9 passes lors de la campagne victorieuse qui a suivi, des statistiques qui lui ont valu le titre de meilleur joueur du championnat. Il compte 46 sélections avec la Zambie.",
      "L'approche de l'AEK n'est d'ailleurs pas la première de l'été. Le Levski Sofia aurait offert 2 millions d'euros pour le milieu plus tôt dans le mercato, une offre que Beer-Sheva a écartée sans ménagement, et qui ressemble aujourd'hui au coup d'envoi d'un marché qui n'a cessé de se réchauffer.",
      "En Grèce, les attentes sont plus élevées encore. Dans le podcast Trivela Boys, Kangwa a été décrit comme le profil disponible le plus proche d'Orbelin Pineda, le meneur de jeu que l'AEK cherche à remplacer, un analyste estimant que le transfert finirait par se situer « aux alentours de 8 millions d'euros » — une valorisation qui, il faut le préciser, relève de la spéculation des médias grecs et non de quoi que ce soit que l'un ou l'autre club ait acté par écrit, et qui se situe bien au-dessus des chiffres rapportés en Israël.",
      "Un compte à rebours réglementaire court sous la négociation. En vertu de l'article 30.05 du règlement de la Ligue des champions de l'UEFA, un joueur aligné lors des tours de qualification ne peut représenter un autre club en compétition de l'UEFA qu'à partir de la phase de ligue. Beer-Sheva entame sa campagne de qualification face au Vikingur mardi — et si Kangwa joue, il serait « cup-tied » (lié au club) pour le reste des tours de qualification et des barrages, dans l'impossibilité d'évoluer pour l'AEK contre son ancien club si les deux équipes se retrouvaient au tour de barrage, comme le notait un média israélien dimanche soir. Un remplaçant non utilisé, précisons-le, n'est pas concerné par la règle ; seules les minutes disputées la déclenchent.",
      "Le calendrier aiguise tout. Beer-Sheva ouvre cette semaine sa campagne de qualification en Ligue des champions, et Kangwa devrait y être central — ce qui donne aux champions toutes les raisons sportives de tenir bon, et offre à leur joueur le plus convoité une vitrine européenne où le prix pourrait encore grimper.",
      "Lundi matin, le dénouement semblait se dessiner, même si le tableau restait contesté. Un média israélien affirmait que l'AEK devait améliorer son offre à environ 3,8 millions d'euros et que l'affaire pourrait être bouclée en une journée — ajoutant qu'un transfert scellé avant le match de mardi épargnerait à Kangwa d'être cup-tied — tandis qu'un second média citait des sources à Beer-Sheva assurant que les négociations n'étaient « pas près d'aboutir pour l'instant », et rapportait, pour le montant comme pour les conditions personnelles du joueur, des chiffres qui varient d'une publication à l'autre. L'entourage du joueur ne laissait guère de doute sur sa préférence : « C'est le moment pour lui de partir », aurait déclaré son cercle. « Tout le monde comprend que c'est l'offre — il faut le laisser filer. » À moins que les clubs ne se rejoignent avant le coup d'envoi à Reykjavik, le joueur de la saison des champions poursuivra tout simplement l'aventure.",
    ],
    facts: [
      "L'AEK Athènes a soumis une offre officielle à l'Hapoël Beer-Sheva pour le milieu Kings Kangwa, rapportée par deux médias israéliens le 19 juillet 2026.",
      "L'offre dépasserait 2,5 millions d'euros, face à un prix demandé par Beer-Sheva de plus de 4 millions.",
      "L'AEK proposerait à Kangwa environ 700 000 euros par an, contre quelque 300 000 à Beer-Sheva (source unique).",
      "Kangwa, 27 ans, est un international zambien aux 46 sélections, arrivé à Beer-Sheva en provenance de l'Étoile rouge de Belgrade à l'été 2024 pour un montant évalué à moins d'un million d'euros.",
      "Il a inscrit 12 buts et délivré 9 passes décisives lors de la saison 2025-2026 du titre et a été élu meilleur joueur du championnat.",
      "Le Levski Sofia avait vu une offre antérieure de 2 millions d'euros pour Kangwa repoussée cet été (source unique).",
      "Un analyste d'un podcast grec a estimé une vente éventuelle aux alentours de 8 millions d'euros — spéculation attribuée, non un chiffre officiel.",
      "En vertu du règlement de l'UEFA (article 30.05), si Kangwa est aligné lors du match qualificatif de Beer-Sheva contre le Vikingur mardi, il devient cup-tied pour la phase de qualification et de barrage, et ne pourrait affronter Beer-Sheva sous les couleurs de l'AEK avant la phase de ligue.",
      "Le 20 juillet, un média rapportait que l'AEK devait porter son offre à environ 3,8 M€ avec une possible finalisation sous 24 heures, tandis que des sources à Beer-Sheva confiaient à un autre média que les négociations n'étaient « pas près d'aboutir pour l'instant » ; les chiffres du transfert et du salaire diffèrent d'une publication à l'autre et aucun accord n'est officiel.",
    ],
    media: {
      alt: "L'AEK Athènes soumet une offre officielle pour Kings Kangwa, la star de l'Hapoël Beer-Sheva",
      caption: "Le club grec a formulé une offre en bonne et due forme pour le milieu zambien qui a porté Beer-Sheva au titre, mais la somme évoquée, supérieure à 2,5 millions d'euros, reste bien en deçà des plus de 4 millions réclamés par les champions.",
    },
  },
  {
    articleId: "live-20260719-kangwa-aek-offer",
    locale: "es",
    title: "El AEK de Atenas presenta una oferta oficial por Kings Kangwa, la estrella del Hapoel Beer Sheva",
    dek: "El club griego ha pujado formalmente por el centrocampista zambiano que llevó al Beer Sheva al título, pero la cifra citada, superior a 2,5 millones de euros, se queda muy lejos de los más de 4 millones que pide el campeón.",
    category: "Fútbol israelí",
    body: [
      "El AEK de Atenas ha presentado una oferta oficial al Hapoel Beer Sheva por Kings Kangwa, el centrocampista internacional zambiano que impulsó al club al campeonato israelí la temporada pasada. La noticia de la puja formal salió a la luz en Israel el domingo por la noche, con dos informaciones distintas confirmando que las negociaciones entre los clubes están ya en marcha y que la propuesta griega es la más sustancial recibida hasta la fecha por el jugador de 27 años.",
      "Las cifras, sin embargo, todavía no dan para un acuerdo. Se entiende que la oferta actual del AEK supera los 2,5 millones de euros, mientras que el Beer Sheva valora a su jugador de la temporada en más de 4 millones. Una estimación en Israel sostiene que una puja en torno a los 3 millones podría sentar a la mesa al club de la propietaria Alona Barkat, aunque tal como están las cosas la oferta se queda corta respecto a sus exigencias.",
      "En cuanto a las condiciones personales, la distancia es bastante más fácil de salvar. Según una información, el AEK estaría dispuesto a pagar a Kangwa unos 700.000 euros al año, más del doble de los aproximadamente 300.000 que cobra actualmente en el Néguev, el tipo de salto salarial que suele hacer reflexionar a un jugador en cuanto los clubes empiezan a hablar.",
      "Kangwa llegó a Beer Sheva en el verano de 2024 procedente del Estrella Roja de Belgrado, donde ganó un título de liga serbia y saboreó la Liga de Campeones, por un traspaso cifrado en menos de un millón de euros. La inversión se ha amortizado con creces: 14 goles y 8 asistencias en su primera temporada, y después 12 goles y 9 asistencias en la campaña del título que siguió, un rendimiento que le valió el premio al mejor jugador de la liga. Suma 46 internacionalidades con Zambia.",
      "La aproximación del AEK no es, además, la primera del verano. El Levski de Sofía habría ofrecido 2 millones de euros por el centrocampista antes en el mercado, una puja que el Beer Sheva rechazó sin contemplaciones y que ahora parece el movimiento inicial de un mercado que no ha dejado de calentarse.",
      "En Grecia, las expectativas son aún mayores. En el podcast Trivela Boys se describió a Kangwa como el perfil disponible más parecido a Orbelin Pineda, el organizador al que el AEK busca sustituir, con un analista estimando que el traspaso acabaría situándose «en torno a los 8 millones de euros», una valoración que, conviene precisar, pertenece a la especulación de la prensa griega y no a nada que ninguno de los dos clubes haya puesto por escrito, y que se sitúa muy por encima de las cifras publicadas en Israel.",
      "Un reloj reglamentario corre por debajo de la negociación. Según el artículo 30.05 del reglamento de la Liga de Campeones de la UEFA, un jugador alineado en las rondas de clasificación solo puede representar a otro club en competición de la UEFA a partir de la fase de liga. El Beer Sheva abre su eliminatoria de clasificación ante el Vikingur el martes, y si Kangwa juega quedaría «cup-tied» (vinculado al club) para el resto de la fase de clasificación y play-off, sin poder alinearse con el AEK contra su antiguo club si ambos se cruzaran en la ronda de play-off, como señaló un medio israelí el domingo por la noche. Un suplente no utilizado, conviene aclarar, no queda afectado por la norma; solo la activan los minutos sobre el césped.",
      "El calendario lo agudiza todo. El Beer Sheva abre esta semana su eliminatoria de clasificación para la Liga de Campeones, y se espera que Kangwa sea central en ella, lo que da al campeón todas las razones deportivas para mantenerse firme y ofrece a su jugador más codiciado un escaparate europeo en el que el precio aún podría subir.",
      "El lunes por la mañana el desenlace parecía perfilarse, aunque el panorama seguía siendo discutido. Un medio israelí afirmaba que se esperaba que el AEK mejorara su oferta hasta unos 3,8 millones de euros y que el acuerdo podría cerrarse en un día —añadiendo que un traspaso sellado antes del partido del martes ahorraría a Kangwa quedar cup-tied—, mientras que un segundo medio citaba a fuentes del Beer Sheva insistiendo en que las negociaciones «no están cerca ahora mismo», y publicaba cifras tanto del traspaso como de las condiciones personales del jugador que difieren entre publicaciones. El entorno del jugador dejaba pocas dudas sobre su preferencia: «Es su momento de salir», habría dicho su círculo. «Todos entienden que esta es la oferta: hay que dejarlo marchar.» A menos que los clubes converjan antes del pitido inicial en Reikiavik, el jugador de la temporada del campeón simplemente seguirá jugando.",
    ],
    facts: [
      "El AEK de Atenas ha presentado una oferta oficial al Hapoel Beer Sheva por el centrocampista Kings Kangwa, informada por dos medios israelíes el 19 de julio de 2026.",
      "La oferta se cifra por encima de los 2,5 millones de euros, frente a un precio de salida del Beer Sheva de más de 4 millones.",
      "El AEK ofrecería a Kangwa unos 700.000 euros al año, frente a los aproximadamente 300.000 del Beer Sheva (fuente única).",
      "Kangwa, de 27 años, es internacional zambiano con 46 partidos y llegó al Beer Sheva procedente del Estrella Roja de Belgrado en el verano de 2024 por un traspaso cifrado en menos de un millón de euros.",
      "Firmó 12 goles y 9 asistencias en la temporada 2025/26 del título y fue elegido mejor jugador de la liga.",
      "El Levski de Sofía había visto rechazada una oferta anterior de 2 millones de euros por Kangwa este verano (fuente única).",
      "Un analista de un podcast griego estimó una eventual venta en torno a los 8 millones de euros, especulación atribuida y no una cifra oficial.",
      "Según el reglamento de la UEFA (artículo 30.05), si Kangwa es alineado en la eliminatoria del Beer Sheva ante el Vikingur el martes queda cup-tied para la fase de clasificación y play-off, y no podría enfrentarse al Beer Sheva con el AEK antes de la fase de liga.",
      "El 20 de julio, un medio informó de que se esperaba que el AEK elevara su oferta a unos 3,8 millones con una posible finalización en 24 horas, mientras fuentes del Beer Sheva dijeron a otro medio que las negociaciones «no están cerca ahora mismo»; las cifras del traspaso y del salario difieren entre publicaciones y ningún acuerdo es oficial.",
    ],
    media: {
      alt: "El AEK de Atenas presenta una oferta oficial por Kings Kangwa, la estrella del Hapoel Beer Sheva",
      caption: "El club griego ha pujado formalmente por el centrocampista zambiano que llevó al Beer Sheva al título, pero la cifra citada, superior a 2,5 millones de euros, se queda muy lejos de los más de 4 millones que pide el campeón.",
    },
  },
];

const articles = JSON.parse(fs.readFileSync(ARTICLES, "utf8"));
const byId = new Map(articles.map((a) => [a.id, a]));
const store = JSON.parse(fs.readFileSync(TRANSLATIONS, "utf8"));
if (!Array.isArray(store.translations)) store.translations = [];

let written = 0;
for (const rec of records) {
  const article = byId.get(rec.articleId);
  if (!article) {
    console.log(`  skip ${rec.articleId} [${rec.locale}] — no such article`);
    continue;
  }
  // Faithful translation must mirror the source structure exactly.
  if (rec.body.length !== article.body.length || rec.facts.length !== article.facts.length) {
    throw new Error(`length mismatch for ${rec.articleId} [${rec.locale}]: body ${rec.body.length}/${article.body.length}, facts ${rec.facts.length}/${article.facts.length}`);
  }
  const sourceVersion = article.updatedAt ?? article.publishedAt;
  store.translations = store.translations.filter((r) => !(r.articleId === rec.articleId && r.locale === rec.locale));
  store.translations.push({
    articleId: rec.articleId,
    locale: rec.locale,
    sourceUpdatedAt: sourceVersion,
    status: "reviewed",
    coverage: "full",
    title: rec.title,
    dek: rec.dek,
    category: rec.category,
    body: rec.body,
    facts: rec.facts,
    media: rec.media,
  });
  written += 1;
  console.log(`  ✓ ${rec.articleId} [${rec.locale}]`);
}

store.schemaVersion = "2.0";
store.updatedAt = new Date().toISOString();
store.visibility = "public";
fs.writeFileSync(TRANSLATIONS, JSON.stringify(store, null, 2) + "\n");
console.log(`Seeded ${written} translations.`);
