import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dryRun = process.argv.includes("--dry-run");
const replaceTextVisuals = process.argv.includes("--replace-text-visuals");
const articleId = process.argv.find((argument) => argument.startsWith("--article="))?.split("=").slice(1).join("=");
const previousMedia = await readFile(path.join(root, "data/article-media.json"), "utf8")
  .then((value) => JSON.parse(value))
  .catch(() => ({}));
const articles = JSON.parse(await readFile(path.join(root, "data/articles.json"), "utf8"))
  .filter((article) => article.status !== "review")
  .filter((article) => !articleId || article.id === articleId)
  .filter((article) => !replaceTextVisuals || previousMedia[article.id]?.src?.endsWith(".svg"))
  // Default (no --article / --replace-text-visuals): only source stories that do
  // not already have an image. This keeps runs incremental and gentle on the
  // Commons API (no full re-search every cycle), so the newsroom can call it each
  // cycle to image just the newly published stories.
  .filter((article) => Boolean(articleId) || replaceTextVisuals || !previousMedia[article.id]);
const outputDirectory = path.join(root, "public/media/stories");
const api = "https://commons.wikimedia.org/w/api.php";
const userAgent = process.env.NEWSROOM_USER_AGENT ?? "Mozilla/5.0 IsraelSportsPulseLocalPreview/0.1";

const queries = {
  "live-20260717-israel-long-beach-board-sailing": "Long Beach California kiteboarding Olympic sailing",
  "live-20260717-world-cup-championship-rings": "FIFA World Cup Trophy 2026",
  "live-20260717-giannis-miami-introduction": "Giannis Antetokounmpo Golden State Warriors 2025",
  "live-20260717-gary-trent-bucks-contract-probe": "Gary Trent Jr Milwaukee Bucks basketball",
  "live-20260717-vincic-world-cup-final": "Slavko Vincic Brazil Morocco 2026 World Cup",
  "live-20260717-world-cup-final-smoke": "MetLife Stadium Exterior 2026 FIFA World Cup",
  "live-20260717-saraf-wolf-brooklyn-houston": "Danny Wolf Israel basketball",
  "live-20260715-recanati-maccabi-ownership": "Maccabi Tel Aviv basketball EuroLeague match",
  "live-20260715-saraf-wolf-brooklyn-sacramento": "Ben Saraf basketball ratiopharm Ulm",
  "live-20260715-kawhi-toronto-trade-hold": "Kawhi Leonard basketball action",
  "live-20260715-world-cup-final-halftime": "2026 FIFA World Cup MetLife Stadium football match",
  "live-20260714-beersheva-vikingur": "Vikingur Reykjavik football match",
  "live-20260714-gil-itzhak-bnei-eilat": "Gil Itzhak football",
  "live-20260714-tielemans-manchester-united": "Youri Tielemans Belgium football",
  "live-20260714-pogacar-tour-stage-10": "Tadej Pogacar Tour de France",
  "live-20260714-otomewo-reims-medical": "Stade Auguste Delaune Reims",
  "live-20260714-lev-hasharon-u17-promotion": "Israel youth football match",
  "live-20260714-motley-red-star-talks": "Johnathan Motley basketball",
  "live-20260714-netanya-nwachukwu": "Sheffield United Bramall Lane stadium",
  "live-20260714-idan-dahan-herzliya": "Maccabi Herzliya football stadium",
  "live-20260714-satoransky-hapoel": "Tomas Satoransky basketball",
  "live-20260714-beitar-four-outside-plans": "Beitar Jerusalem football match",
  "live-20260714-beitar-flares": "Beitar Jerusalem football match",
  "live-20260714-israel-u20-handball-poland": "Israel national handball team",
  "live-20260714-peretz-miller-maccabi": "Dor Peretz Maccabi Tel Aviv",
  "live-20260714-gloukh-ajax-role": "Oscar Gloukh Ajax",
  "live-20260714-basketball-coaches-registration": "Israel basketball coach team",
  "live-20260714-lonnie-walker": "Lonnie Walker IV basketball",
  "live-20260714-super-cup-kanaan": "Hapoel Beer Sheva Turner Stadium football match",
  "live-20260714-zach-leday": "Zach LeDay basketball",
  "live-20260714-khalaili": "Anan Khalaili RUSG",
  "live-20260713-tour-crowd-incident": "Tour de France spectators finish",
  "brief-20260714-tiberias-investigation": "Ironi Tiberias football",
  "brief-20260714-france-knockout-record": "Spain national football team 2025",
  "brief-20260714-tomer-asayag": "Ironi Kiryat Ata basketball",
  "brief-20260714-yarden-garzon": "Yarden Garzon basketball",
  "brief-20260714-yarin-levy": "Maccabi Haifa football player",
  "brief-20260714-beitar-season-tickets": "Beitar Jerusalem supporters Teddy Stadium",
  "brief-20260713-oren-sahar": "Pepperdine Waves basketball",
  "brief-20260713-israel-u20-men-czechia": "Israel national basketball team youth",
  "brief-20260714-liam-elok": "Hapoel Ramat Gan football",
  "brief-20260714-israeli-referees": "UEFA association football referee",
  "brief-20260714-neymar-future": "Neymar Brazil football",
  "brief-20260712-saraf-wolf-summer-league": "Ben Saraf basketball",
  "brief-20260714-or-zahavi": "Maccabi Kiryat Gat football",
  "brief-20260714-maccabi-haifa-sponsor": "Maccabi Haifa football shirt",
  "seed-001": "Israel Super Cup football trophy",
  "seed-002": "Maccabi Tel Aviv football supporters stadium",
  "seed-003": "Israel women's national basketball team",
  "seed-005": "Maccabi Tel Aviv football match",
  "seed-006": "Israel national basketball team",
  "seed-007": "Oscar Gloukh football",
  "seed-008": "Israeli sport stadium crowd",
  "seed-009": "Lionel Messi Argentina football",
  "seed-010": "FIFA World Cup stadium football",
  "seed-011": "Tadej Pogacar Tour de France",
  "seed-012": "Jaylen Brown Boston Celtics",
  "seed-013": "Los Angeles 2028 Olympics",
  "seed-014": "Jannik Sinner tennis",
  "brief-20260714-abramov-security": "Barak Abramov Beitar Jerusalem",
  "brief-20260714-netanya-tshibangu": "Isaac Tshibangu football",
  "brief-20260714-beitar-recruitment": "Beitar Jerusalem football player",
  "brief-20260714-beersheva-qualifier": "Turner Stadium Beersheba football",
  "brief-20260714-bnei-eilat-transition": "Eilat football stadium",
  "brief-20260714-maccabiah-closing": "Maccabiah Games ceremony",
  "brief-20260714-avdija-garnett": "Kevin Garnett basketball",
  "feature-20260714-england-argentina-rivalry": "England Argentina football match",
  "brief-20260714-bellingham-fan-vote": "Jude Bellingham England football",
  "feature-20260714-ronaldo-madeira": "Cristiano Ronaldo Madeira",
  "brief-20260714-avdija-insurance": "Deni Avdija Israel basketball",
  "brief-20260714-hasan-hilo": "Hasan Hilo Bnei Sakhnin",
  "brief-20260714-la28-israel-house": "Los Angeles skyline Olympics",
  "brief-20260714-la-liga-schedule": "La Liga football stadium",
  "brief-20260714-youth-registration": "Israel youth football match",
  "brief-20260714-leo-coelho-lawsuit": "Leo Coelho football Brazil",
  "archive-20260714-france-israel-1993": "Parc des Princes stadium Paris",
  "archive-20260715-mexico-1970": "Israel national football team 1970",
  "live-20260716-boavista-insolvency-closure": "Estadio do Bessa Boavista Porto",
  "live-20260716-hapoel-jerusalem-badge-petition": "Hapoel Jerusalem basketball playoff Pais Arena",
  "live-20260716-paris-lee-ness-ziona": "Paris Lee UNICS basketball 2026",
  "live-20260716-daniel-warku-compensation": "Beitar Jerusalem football match",
  "live-20260716-luan-campos-hapoel-ramat-gan": "Ramat Gan Stadium football",
  "live-20260716-diarra-kasimpasa-hapoel-tel-aviv": "Tiemoko Diarra football",
  "live-20260716-emanuel-sharp-celtics-summer-league": "Sacramento Kings basketball game",
  "live-20260715-israel-u20-greece": "Stozice Arena Ljubljana basketball",
  "live-20260716-noam-mocha-compensation": "Yud Alef Stadium Ashdod",
  "live-20260716-israel-u20-handball-faroe-islands": "Cluj Polyvalent Hall Romania",
  "live-20260716-radinio-balker-huddersfield-extension": "Radinio Balker footballer",
  "live-20260716-trump-world-cup-final-attendance": "Donald Trump FIFA World Cup task force",
  "column-20260716-yehezkel-super-cup-width": "Maccabi Tel Aviv football champions",
  "live-20260717-kanichowsky-ferencvaros-twente": "Gabi Kanichowsky football",
  "live-20260717-varsano-u18-record": "Stadio Raul Guidobaldi Rieti athletics",
  "live-20260717-beitar-hapoel-ta-police-guidelines": "Netanya Stadium",
  "live-20260717-rivollier-hapoel-return": "HaMoshava Stadium Petah Tikva",
  "live-20260717-israel-u20-iceland-handball": "Turda Arena",
  "live-20260719-israel-relay-record-rieti": "Stadio Raul Guidobaldi panorama",
  "live-20260719-israel-u20-handball-world-championship": "Horia Demian hall Cluj",
  "live-20260719-martins-slovan-bratislava": "Cristian Martinez England v Panama",
  "live-20260719-haziza-netanya": "Dolev Haziza",
  "live-20260719-kangwa-aek-offer": "Kings Kangwa Hapoel Beer Sheva",
  "live-20260719-lemkin-twente-interview": "Stav Lemkin",
  "live-20260719-atias-retirement": "Givat Ram Stadium Jerusalem",
  "live-20260719-israel-u20-lithuania-eurobasket": "Arena Stozice Ljubljana",
  "live-20260719-konfino-maccabi-ashdod": "Maccabi Ashdod HaKiriya arena",
  "live-20260719-tour-stage15-vingegaard": "Remco Evenepoel Tour de France",
  "live-20260719-hapoel-ta-sofia-season-start": "Arena Armeec Sofia",
  "live-20260720-world-cup-final-spain-argentina": "Ferran Torres Spain",
  "live-20260720-scaloni-departure": "Lionel Scaloni",
  "live-20260719-dowtin-napoli": "Napoli Basket",
  "live-20260720-afriyie-injury": "Blessing Afrifah 200m",
  "live-20260719-eli-ohana-farewell": "Eli Ohana portrait",
  "live-20260719-datiashvili-youth-europeans": "ILCA 6 dinghy racing",
  "live-20260719-kerr-mile-world-record": "Josh Kerr athletics",
  "live-20260719-gadrani-beitar-standoff": "Beitar Jerusalem MTK 2016 match",
  "column-20260719-second-wave-youth-basketball": "Ben Saraf Ratiopharm Ulm EuroCup",
  "archive-20260719-helsinki-1952": "First Israeli Olympic Team 1952",
  "live-20260719-france-england-bronze": "Bukayo Saka England 2026",
  "live-20260718-israel-u20-latvia-rout": "Stozice Arena Ljubljana",
  "live-20260718-beitar-hapoel-ta-netanya-report": "Netanya Stadium match",
  "live-20260718-rogers-chelsea-record": "Morgan Rogers England",
  "live-20260718-koppel-referee-sponsorship-row": "Sapir Berman Israeli referee",
  "live-20260718-tsunami-maccabi-haifa": "Wenderson Tsunami",
  "live-20260718-yermakov-metalist-record-sale": "Metalist Stadium Kharkiv",
  "live-20260718-show-kocaelispor-permanent": "Kocaeli Stadyumu",
  "live-20260718-abuhatzira-release-clause": "Maccabi Netanya players",
  "live-20260718-sakhnin-balbarau": "Doha Stadium Sakhnin",
  "live-20260718-varela-interest": "Bloomfield Stadium 2022",
  "column-20260718-develop-and-sell-summer": "Sammy Ofer Stadium Haifa",
  "archive-20260718-montreal-1976": "Esther Shahamorov athletics",
  "live-20260718-guildford-maccabi-ban-payout": "Villa Park Birmingham stadium",
  "live-20260718-sharp-kings-summer-league-finale": "Thomas and Mack Center Las Vegas basketball",
  "live-20260717-abu-fani-red-star-macva50": "Mohammad Abu Fani",
  "live-20260717-zaarura-russian-interest": "Netanya Stadium panorama",
  "live-20260717-stilman-recanati-interview": "Maccabi Tel Aviv basketball EuroLeague",
  "live-20260717-liam-hermesh-agrees-grazer-ak-move": "Merkur Arena Graz",
  "live-20260717-france-world-cup-replay-petition-fifa-backs-referee": "Lamine Yamal Spain",
  "live-20260717-police-announce-further-arrest-japanika-grenade-attacks": "Teddy Stadium Jerusalem",
  "live-20260717-worko-beitar-debut-shua-doubt-carabali-commits": "Beitar Jerusalem training",
  "live-20260717-red-star-glazer-fee-demand": "Omri Glazer goalkeeper",
  "live-20260717-kanyuk-ramat-gan-bonus-claim": "Ramat Gan Stadium",
  "live-20260717-szoboszlai-signs-new-liverpool-deal-to-2031": "Dominik Szoboszlai Liverpool",
  "live-20260717-orian-goren-tipped-to-cover-injured-de-jong-barcelona": "Camp Nou Barcelona",
  "live-20260717-us-analysts-warn-portland-morant-gamble-squeezes-avdija": "Deni Avdija basketball",
  "live-20260717-novakovich-profile-saief-reunion": "Sammy Ofer Stadium Haifa",
  "live-20260717-levy-gal-470-junior-worlds-silver-gdynia": "470 dinghy sailing race",
  "live-20260717-david-natan-obituary": "Ramat Gan stadium 1958 Israel Wales",
  "live-20260717-eissat-forced-off-eight-minutes-into-bristol-city-debut": "Ashton Gate Bristol City",
  "live-20260717-hapoel-tel-aviv-close-in-on-jacob-toppin": "Jacob Toppin basketball",
};

// Exact, human-reviewed Commons files take precedence over search results. This
// prevents a plausible keyword match from putting an unrelated club, athlete or
// venue on a story. Search remains the fallback for new newsroom items.
const preferredFiles = {
  "live-20260717-israel-long-beach-board-sailing": "File:29 Strong Wind Dragged The Kitesurfer Forward Fast.jpg",
  "live-20260717-world-cup-championship-rings": "File:FIFA World Cup Trophy photo by Djuradj Vujcic.jpg",
  "live-20260717-giannis-miami-introduction": "File:Giannis Antetokounmpo vs Golden State Warriors 2025.jpg",
  "live-20260717-gary-trent-bucks-contract-probe": "File:Milwaukee Bucks at LA Clippers (January 25, 2025).jpg",
  "live-20260717-vincic-world-cup-final": "File:Slavko Vincic Brazil V Morocco 13 June 2026-112 (cropped).jpg",
  "live-20260717-world-cup-final-smoke": "File:MetLife Stadium Exterior, 2026 FIFA World Cup (June 20, 2026) (cropped).jpg",
  "live-20260717-saraf-wolf-brooklyn-houston": "File:Danny Wolf.jpg",
  "live-20260715-recanati-maccabi-ownership": "File:2022-12-22 ALBA Berlin gegen Maccabi Tel Aviv B.C. (EuroLeague 2022-23) by Sandro Halank–010.jpg",
  "live-20260715-saraf-wolf-brooklyn-sacramento": "File:2025-05-21 ALBA Berlin gegen ratiopharm Ulm (Basketball-Bundesliga 2024-25) by Sandro Halank–074.jpg",
  "live-20260715-kawhi-toronto-trade-hold": "File:1 kawhi leonard 2019 nba finals.jpg",
  "live-20260715-world-cup-final-halftime": "File:Ismael SAIBARI, GABRIEL MAGALHAES, and MARQUINHOS at 2026 FIFA World Cup by YantsImages.jpg",
  "live-20260714-beersheva-vikingur": "File:Vikingur vs Valur aug07.jpg",
  "live-20260714-gil-itzhak-bnei-eilat": "File:Gil Itzhak.JPG",
  "live-20260714-tielemans-manchester-united": "File:Youri Tielemans USMNT v Belgium Mar 28 2026-20 (cropped).jpg",
  "live-20260714-pogacar-tour-stage-10": "File:Tadej Pogacar in the descent of Tourmalet pass during stage 14 of TDF 24.jpg",
  "live-20260714-otomewo-reims-medical": "File:Stade Auguste-Delaune Reims.jpg",
  "live-20260714-lev-hasharon-u17-promotion": "File:PikiWiki Israel 7321 football game.jpg",
  "live-20260714-motley-red-star-talks": "File:Johnathan Motley 0 Fenerbahçe Basketball 20220925 (9).jpg",
  "live-20260714-netanya-nwachukwu": "File:Sheffield united bramall lane stadium.jpg",
  "live-20260714-idan-dahan-herzliya": "File:Herzliya Toto Stadium.jpg",
  "live-20260714-satoransky-hapoel": "File:Tomáš Satoranský 13 FC Barcelona (basketball) Euroleague 20250402 (2).jpg",
  "live-20260714-beitar-four-outside-plans": "File:Beitar Jerusalem FC vs. MTK Budapest FC 2016-06-18 (017).jpg",
  "live-20260714-beitar-flares": "File:Beitar Jerusalem FC vs. MTK Budapest FC 2016-06-18 (015).jpg",
  "live-20260714-israel-u20-handball-poland": "File:Israel men's national handball team Hand-ball bulletin federal 1989-1-1.jpg",
  "live-20260714-peretz-miller-maccabi": "File:Dor Peretz.JPG",
  "live-20260714-gloukh-ajax-role": "File:Oscar Gloukh.jpg",
  "live-20260714-basketball-coaches-registration": "File:Oded Katash Hapoel Eilat.jpg",
  "live-20260714-lonnie-walker": "File:20170329 MCDAAG Lonnie Walker IV above the rim.jpg",
  "live-20260714-super-cup-kanaan": "File:Turner Stadium on February 27th 2017 Beer Sheva vs. Kfar Saba.jpg",
  "live-20260714-zach-leday": "File:Zach LeDay.jpg",
  "live-20260714-khalaili": "File:Anan Khalaili RUSG 2026.jpg",
  "live-20260713-tour-crowd-incident": "File:2009 Tour de France - 11th stage (2).jpg",
  "brief-20260714-tiberias-investigation": "File:Tiberias Municipal Football Stadium10.jpg",
  "brief-20260714-france-knockout-record": "File:Spain football team in 2025.jpg",
  "brief-20260714-tomer-asayag": "File:Basketball arena.jpg",
  "brief-20260714-yarden-garzon": "File:ירדן גרזון.jpg",
  "brief-20260714-yarin-levy": "File:Maccabi Haifa goal celebrations.JPG",
  "brief-20260714-beitar-season-tickets": "File:Beitar Jerusalem fans.jpg",
  "brief-20260713-oren-sahar": "File:Firestone Fieldhouse (Pepperdine).jpg",
  "brief-20260713-israel-u20-men-czechia": "File:Basketball game in Jerusalem Israel`s new Pais Arena.jpg",
  "brief-20260714-liam-elok": "File:Hapoel cup2012.jpg",
  "brief-20260714-israeli-referees": "File:אוראל גרינפלד 2022.jpg",
  "brief-20260714-neymar-future": "File:Neymar visiting Red Bull Arena (cropped).jpg",
  "brief-20260712-saraf-wolf-summer-league": "File:2025-05-21 ALBA Berlin gegen ratiopharm Ulm (Basketball-Bundesliga 2024-25) by Sandro Halank–007.jpg",
  "brief-20260714-or-zahavi": "File:PikiWiki Israel 16148 kiryat gat.jpg",
  "brief-20260714-maccabi-haifa-sponsor": "File:Bayern Munich vs Maccabi Haifa (4136159945).jpg",
  "seed-001": "File:מכבי חיפה והפועל באר שבע במשחק אלוף האלופים.jpg",
  "seed-002": "File:Bloomfield Stadium18.jpg",
  "seed-003": "File:Flickr - Government Press Office (GPO) - Women's Championship Basketball.jpg",
  "seed-005": "File:Dan Hadani collection (990044458250205171) (cropped2).jpg",
  "seed-006": "File:ISRAEL BASKETBALL TEAM. R-L 1ST. ROW, A. HEMO.jpg",
  "seed-007": "File:FC Salzburg gegen Paris Saint-Germain UEFA Champions League 49 (cropped).jpg",
  "seed-008": "File:Israeli Fans (3906990812).jpg",
  "seed-009": "File:Lionel Messi, Player of Argentina national football team, and FC Barcelona.JPG",
  "seed-010": "File:RK 1009 9831 Volksparkstadion.jpg",
  "seed-011": "File:Tadej Pogacar Mont Ventoux Tour de France 2021.jpg",
  "seed-012": "File:Jaylen Brown 2022 (cropped).jpg",
  "seed-013": "File:Los Angeles Memorial Coliseum Olympic Statues.jpg",
  "seed-014": "File:Jannik Sinner (2024 US Open) 04 (cropped).jpg",
  "brief-20260714-abramov-security": "File:Teddy-stadium-exterior-.jpg",
  "brief-20260714-netanya-tshibangu": "File:Maccabi Netanya F.C. SAM 1568.jpg",
  "brief-20260714-beitar-recruitment": "File:Beitar Jerusalem FC vs. MTK Budapest FC 2016-06-18 (004).jpg",
  "brief-20260714-beersheva-qualifier": "File:Turner Football staduim beer sheva.jpg",
  "brief-20260714-bnei-eilat-transition": "File:Eilat Sports Center by Bodek Achitects.JPG",
  "brief-20260714-maccabiah-closing": "File:1935 Maccabiah Games opening ceremony (27).jpg",
  "brief-20260714-avdija-garnett": "File:OpeningTipoffGame2-2008NBAFinals.jpg",
  "feature-20260714-england-argentina-rivalry": "File:Maradona vs england.jpg",
  "brief-20260714-bellingham-fan-vote": "File:Kwasi Sibo 8, Jude BELLINGHAM 10 England v Ghana at 2026 Fifa World Cup by YantsImages 01 (cropped).jpg",
  "feature-20260714-ronaldo-madeira": "File:2016 Escultura de Cristiano Ronaldo perante o seu museo de Funchal. Madeira. Portugal-23.jpg",
  "brief-20260714-avdija-insurance": "File:Israel vs Argentinia (106-83) - 2018092183932 2018-04-02 Basketball Albert Schweitzer Turnier Israel - Argentinia - Sven - 1D X MK II - 159 - AK8I1867.jpg",
  "brief-20260714-hasan-hilo": "File:HaPoel Beer Sheva vs. Bnei Sakhnin F.C. .jpg",
  "brief-20260714-la28-israel-house": "File:Olympic Torch Tower of the Los Angeles Coliseum.jpg",
  "brief-20260714-la-liga-schedule": "File:Flickr - tpower1978 - Liga (4).jpg",
  "brief-20260714-youth-registration": "File:Afula Municipal Stadium (3).jpg",
  "brief-20260714-leo-coelho-lawsuit": "File:Nacional vs Defensor Sporting.jpg",
  "archive-20260714-france-israel-1993": "File:Paris Parc des Princes 1.jpg",
  "archive-20260715-mexico-1970": "File:Israeli National Team 1970.jpg",
  "live-20260716-boavista-insolvency-closure": "File:Estádio do Bessa - Porto - Portugal (6488730091).jpg",
  "live-20260716-hapoel-jerusalem-badge-petition": "File:Jerusalem Arena in a Playoff Match.jpg",
  "live-20260716-paris-lee-ness-ziona": "File:Paris Lee @ BC UNICS (2026-02-04) - 0.jpg",
  "live-20260716-daniel-warku-compensation": "File:Beitar Jerusalem FC vs. MTK Budapest FC 2016-06-18 (026).jpg",
  "live-20260716-luan-campos-hapoel-ramat-gan": "File:Ramat Gan Ramat Gan Stadium 2.jpg",
  "live-20260716-diarra-kasimpasa-hapoel-tel-aviv": "File:Kasımpaşa Stadyumu.jpg",
  "live-20260716-emanuel-sharp-celtics-summer-league": "File:Spurs vs. Kings (6734457481).jpg",
  "live-20260715-israel-u20-greece": "File:Stožice Arena.jpg",
  "live-20260716-noam-mocha-compensation": "File:Yud-Alef Stadium 2023.jpg",
  "live-20260716-israel-u20-handball-faroe-islands": "File:Cluj Polyvalent Hall 2.jpg",
  "live-20260716-radinio-balker-huddersfield-extension": "File:Radinio balker-1688593475.jpg",
  "live-20260716-trump-world-cup-final-attendance": "File:P20251117DT-0115 President Donald Trump speaks with members of the White House Task Force on the 2026 FIFA World Cup.jpg",
  "column-20260716-yehezkel-super-cup-width": "File:Maccabi Tel-Aviv against Dynamo Kiev1.jpg",
  "live-20260717-kanichowsky-ferencvaros-twente": "File:גבי קניקובסקי.jpg",
  "live-20260717-varsano-u18-record": "File:Stadio Raul Guidobaldi, Rieti - 01.JPG",
  "live-20260717-beitar-hapoel-ta-police-guidelines": "File:Netanya-Stadium 40.jpg",
  "live-20260717-rivollier-hapoel-return": "File:HaMoshava Stadium, June 2016 03.jpg",
  "live-20260717-israel-u20-iceland-handball": "File:Turda Arena Interior.jpg",
  "live-20260719-israel-relay-record-rieti": "File:Panorama dello stadio Raul Guidobaldi (Rieti).jpg",
  "live-20260719-israel-u20-handball-world-championship": "File:Kolozsvar Sportcsarnok.JPG",
  "live-20260719-martins-slovan-bratislava": "File:Cristian Martinez England v Panama 27 June 26-230.jpg",
  "live-20260719-haziza-netanya": "File:Dolev Haziza 2020.jpg",
  "live-20260719-kangwa-aek-offer": "File:קינגס קנגווה במדי הפועל באר שבע.jpg",
  "live-20260719-lemkin-twente-interview": "File:Grolsch Veste wedstrijd.JPG",
  "live-20260719-atias-retirement": "File:GivatRamStadiumJan052023 03.jpg",
  "live-20260719-israel-u20-lithuania-eurobasket": "File:Stožice3.jpg",
  "live-20260719-konfino-maccabi-ashdod": "File:Maccabi ashdod 2010.jpg",
  "live-20260719-tour-stage15-vingegaard": "File:Tour de France 2025 - Remco Evenepoel N21.jpg",
  "live-20260719-hapoel-ta-sofia-season-start": "File:Арена Армеец интериор.jpg",
  "live-20260720-world-cup-final-spain-argentina": "File:Ferran Torres France v Spain 7.24.26-025.jpg",
  "live-20260720-scaloni-departure": "File:Scaloni - ARG v CAN - 2024-07-09 (cropped).jpg",
  "live-20260719-dowtin-napoli": "File:Napoli Basket vs Olimpia 2024-2025.jpg",
  "live-20260720-afriyie-injury": "File:Start blocks.JPG",
  "live-20260719-eli-ohana-farewell": "File:Eli Ohana, August 2017 (4972) (cropped).jpg",
  "live-20260719-datiashvili-youth-europeans": "File:GBR ILCA 6 dinghy racing in Waymouth Bay.jpg",
  "live-20260719-kerr-mile-world-record": "File:Josh Kerr winning the Men\u0027s 5000m final at the 2025 UK Athletics Championship.jpg",
  "live-20260719-gadrani-beitar-standoff": "File:Beitar Jerusalem FC vs. MTK Budapest FC 2016-06-18 (031).jpg",
  "column-20260719-second-wave-youth-basketball": "File:Ben Saraf 77 Ratiopharm Ulm EuroCup 20241014 (1).jpg",
  "archive-20260719-helsinki-1952": "File:Flickr - Government Press Office (GPO) - First Israeli Olympic Team.jpg",
  "live-20260719-france-england-bronze": "File:Bukayo Saka England v Ghana 23 June 2026-057 (cropped).jpg",
  "live-20260718-israel-u20-latvia-rout": "File:Stozice4.jpg",
  "live-20260718-beitar-hapoel-ta-netanya-report": "File:Netanya-Stadium 41.jpg",
  "live-20260718-rogers-chelsea-record": "File:Morgan Rogers England v Panama 27 June 26-144 (cropped).jpg",
  "live-20260718-koppel-referee-sponsorship-row": "File:אוראל גרינפלד 2022.jpg",
  "live-20260718-tsunami-maccabi-haifa": "File:Wenderson Tsunami.jpg",
  "live-20260718-yermakov-metalist-record-sale": "File:Metalist Stadium Kharkiv.jpg",
  "live-20260718-show-kocaelispor-permanent": "File:Yıldız Entegre Kocaeli Stadyumu (2025).jpg",
  "live-20260718-abuhatzira-release-clause": "File:Maccabi Netanya F.C 2.jpg",
  "live-20260718-sakhnin-balbarau": "File:Doha Stadium01.jpg",
  "live-20260718-varela-interest": "File:Bloomfield Stadium, January 2022 - 42.jpg",
  "column-20260718-develop-and-sell-summer": "File:Sammy Ofer Stadium air.jpg",
  "archive-20260718-montreal-1976": "File:Esther Roth-Shahamorov at the night competition July 2013 04 (cropped).JPG",
  "live-20260718-guildford-maccabi-ban-payout": "File:Villa Park - geograph.org.uk - 663827.jpg",
  "live-20260718-sharp-kings-summer-league-finale": "File:ThomasandMackinside.jpg",
  "live-20260717-abu-fani-red-star-macva50": "File:Mohammad Abu Fani, June 2023 (GPOABG145038) (cropped).jpeg",
  "live-20260717-zaarura-russian-interest": "File:Netanya Stadium Panorama.JPG",
  "live-20260717-stilman-recanati-interview": "File:2022-12-22 ALBA Berlin gegen Maccabi Tel Aviv B.C. (EuroLeague 2022-23) by Sandro Halank–111.jpg",
  "live-20260717-liam-hermesh-agrees-grazer-ak-move": "File:Merkur Arena, Graz.jpg",
  "live-20260717-france-world-cup-replay-petition-fifa-backs-referee": "File:Lamine Yamal in 2025 (cropped).jpg",
  "live-20260717-police-announce-further-arrest-japanika-grenade-attacks": "File:Teddy Stadium, Jerusalem.jpg",
  "live-20260717-worko-beitar-debut-shua-doubt-carabali-commits": "File:Beitar Jerusalem in training.JPG",
  "live-20260717-red-star-glazer-fee-demand": "File:Omri Glazer Haifa.jpg",
  "live-20260717-kanyuk-ramat-gan-bonus-claim": "File:Ramat Gan Ramat Gan Stadium 3.jpg",
  "live-20260717-szoboszlai-signs-new-liverpool-deal-to-2031": "File:Dominik Szoboszlai 04012026 (1).jpg",
  "live-20260717-orian-goren-tipped-to-cover-injured-de-jong-barcelona": "File:Camp Nou aerial (cropped).jpg",
  "live-20260717-us-analysts-warn-portland-morant-gamble-squeezes-avdija": "File:Deni Avdija Rui Hachimura (51873832857).jpg",
  "live-20260717-novakovich-profile-saief-reunion": "File:Sammy Ofer Stadium panorama.JPG",
  "live-20260717-levy-gal-470-junior-worlds-silver-gdynia": "File:470 al via.jpg",
  "live-20260717-david-natan-obituary": "File:The Israeli team playing against Wales at the Ramat Gan stadium, 1958 D448-079.jpg",
  "live-20260717-eissat-forced-off-eight-minutes-into-bristol-city-debut": "File:The South Stand at Ashton Gate Stadium - geograph.org.uk - 7971073.jpg",
  "live-20260717-hapoel-tel-aviv-close-in-on-jacob-toppin": "File:Jacob Toppin.jpg",
};

const categoryFallbacks = {
  "Israeli Basketball": "basketball game arena",
  "Israeli Football": "association football match stadium",
  "Israeli Olympic Sport": "Olympic sport athlete",
  "Israeli Youth Sport": "youth football match",
  "Israelis Abroad": "professional athlete competition",
  "World Football": "international association football match",
  "Global Sport": "professional sport competition",
  "ILSP Columns": "sports stadium crowd",
  "The Name Desk": "football player portrait",
  NBA: "NBA basketball game",
  Olympics: "Olympic Games athlete",
  Cycling: "road cycling race",
  Tennis: "professional tennis match",
};

const mediaCopy = {
  "live-20260717-israel-long-beach-board-sailing": {
    alt: "A kiteboarder races in strong wind on Alamitos Bay beside Belmont Shore in Long Beach",
    caption: "A kiteboarder races on Alamitos Bay beside Belmont Shore in Long Beach on 31 July 2007. Exact-venue and discipline file photograph; the athlete is not part of Israel's 2026 Formula Kite or iQFOiL squad.",
  },
  "live-20260717-world-cup-championship-rings": {
    alt: "The FIFA World Cup Trophy on display in Toronto in May 2026",
    caption: "The FIFA World Cup Trophy on display in Toronto on 26 May 2026. Current-tournament file photograph of the award that Argentina or Spain will lift alongside receiving the first FIFA championship rings.",
  },
  "live-20260717-giannis-miami-introduction": {
    alt: "Giannis Antetokounmpo drives with the ball against the Golden State Warriors",
    caption: "Giannis Antetokounmpo in action against the Golden State Warriors on 18 March 2025. Exact-player file photograph from before his July 2026 Miami introduction.",
  },
  "live-20260717-gary-trent-bucks-contract-probe": {
    alt: "Gary Trent Jr. in action for the Milwaukee Bucks against the LA Clippers",
    caption: "Gary Trent Jr. with the Milwaukee Bucks against the LA Clippers on 25 January 2025. Exact-player and team file photograph from before his July 2026 contract review.",
  },
  "live-20260717-vincic-world-cup-final": {
    alt: "Slavko Vinčić referees Brazil against Morocco at the 2026 FIFA World Cup",
    caption: "Slavko Vinčić during Brazil against Morocco at New York New Jersey Stadium on 13 June 2026. Exact-referee photograph from his current World Cup campaign.",
  },
  "live-20260717-world-cup-final-smoke": {
    alt: "New York New Jersey Stadium in its 2026 FIFA World Cup configuration",
    caption: "New York New Jersey Stadium in its 2026 FIFA World Cup configuration on 20 June 2026. Exact-venue file photograph taken before the Argentina–Spain final.",
  },
  "live-20260717-saraf-wolf-brooklyn-houston": {
    alt: "Danny Wolf celebrates while representing Israel at the 2023 FIBA U20 European Championship",
    caption: "Danny Wolf celebrates with Israel during the 2023 FIBA U20 European Championship. Exact-player file photograph from before he joined Brooklyn.",
  },
  "live-20260714-super-cup-kanaan": {
    alt: "Hapoel Be’er Sheva attack during a match at Turner Stadium",
    caption: "Hapoel Be’er Sheva attack Hapoel Kfar Saba at Turner Stadium on 27 February 2017. File photograph of the venue and home team used for the 2026 Super Cup final report.",
  },
  "live-20260715-recanati-maccabi-ownership": {
    alt: "Maccabi Tel Aviv forward Bonzie Colson warming up before a EuroLeague game against ALBA Berlin",
    caption: "Maccabi Tel Aviv’s Bonzie Colson warming up before the EuroLeague game against ALBA Berlin on 22 December 2022. File photograph.",
  },
  "live-20260715-saraf-wolf-brooklyn-sacramento": {
    alt: "Ben Saraf drives to the basket for ratiopharm Ulm against ALBA Berlin",
    caption: "Ben Saraf drives through the ALBA Berlin defence for ratiopharm Ulm on 21 May 2025. File photograph.",
  },
  "live-20260715-kawhi-toronto-trade-hold": {
    alt: "Kawhi Leonard in action for the Toronto Raptors during the 2019 NBA Finals",
    caption: "Kawhi Leonard in action for Toronto during the 2019 NBA Finals. File photograph.",
  },
  "live-20260715-world-cup-final-halftime": {
    alt: "Ismael Saibari challenges Gabriel Magalhães and Marquinhos during Brazil against Morocco at the 2026 World Cup",
    caption: "Ismael Saibari contests the ball with Gabriel Magalhães and Marquinhos during Brazil–Morocco at New York New Jersey Stadium on 13 June 2026. File photograph.",
  },
  "brief-20260714-france-knockout-record": {
    alt: "Spain’s national team line up in 2025, including Mikel Oyarzabal, Lamine Yamal and Pedro Porro",
    caption: "Spain’s national team before a 2025 match, with semi-final scorers Mikel Oyarzabal and Pedro Porro in the group. This file photograph predates the 2026 World Cup.",
  },
  "live-20260714-gil-itzhak-bnei-eilat": {
    alt: "Israeli forward Gil Itzhak playing for Bnei Yehuda against Beitar Jerusalem in 2015",
    caption: "Gil Itzhak in action for Bnei Yehuda against Beitar Jerusalem in a 2015 file photograph, before his 2026 move to Bnei Eilat.",
  },
  "live-20260714-basketball-coaches-registration": {
    alt: "Israeli basketball coach Oded Katash directing Hapoel Eilat from the sideline",
    caption: "Oded Katash coaching Hapoel Eilat in a file photograph illustrating Israeli basketball coaching. Katash is not identified as a party to the registration dispute.",
  },
  "brief-20260713-oren-sahar": {
    alt: "Firestone Fieldhouse, home of Pepperdine Waves basketball in Malibu",
    caption: "Firestone Fieldhouse at Pepperdine University, where Oren Sahar is beginning his college basketball chapter.",
  },
  "archive-20260714-france-israel-1993": {
    alt: "The interior of the Parc des Princes in Paris, venue of Israel’s 3–2 win over France in 1993",
    caption: "The Parc des Princes, the Paris stadium where Israel beat France 3–2 on 13 October 1993. This is a later file photograph of the exact venue, not an image of the match.",
  },
  "archive-20260715-mexico-1970": {
    alt: "Israel’s national football team line up at Bloomfield Stadium in January 1970",
    caption: "Israel’s 1970 national team before a January friendly against the Netherlands at Bloomfield Stadium, months before the World Cup in Mexico. This is the squad, not the Sweden match.",
  },
  "live-20260716-boavista-insolvency-closure": {
    alt: "The floodlit Estádio do Bessa in Porto, which Boavista have been ordered to vacate by 31 July 2026",
    caption: "The Estádio do Bessa in Porto in an October 2006 file photograph. Boavista have been ordered to vacate the stadium and adjoining premises by 31 July 2026.",
  },
  "live-20260716-hapoel-jerusalem-badge-petition": {
    alt: "Hapoel Jerusalem play Maccabi Rishon LeZion before a packed lower bowl at Jerusalem Arena",
    caption: "Hapoel Jerusalem play Maccabi Rishon LeZion in a 2015 playoff game at Jerusalem Arena. File photograph of the club and its supporters before the 2026 badge consultation.",
  },
  "live-20260716-paris-lee-ness-ziona": {
    alt: "Paris Lee in action for UNICS Kazan in February 2026",
    caption: "Paris Lee playing for UNICS Kazan against Uralmash on 4 February 2026, before his move to Ironi Ness Ziona.",
  },
  "live-20260716-daniel-warku-compensation": {
    alt: "A Beitar Jerusalem player after a 2016 pre-season football match",
    caption: "A Beitar Jerusalem player after a 2016 pre-season match. Club file photograph used for the Daniel Warku registration ruling; Warku is not shown.",
  },
  "live-20260716-luan-campos-hapoel-ramat-gan": {
    alt: "The pitch and stands at Ramat Gan Stadium",
    caption: "Ramat Gan Stadium, the home setting awaiting Hapoel Ramat Gan after Luan Campos joined the promoted club. File photograph.",
  },
  "live-20260716-diarra-kasimpasa-hapoel-tel-aviv": {
    alt: "The pitch and stands inside Kasımpaşa's Recep Tayyip Erdoğan Stadium",
    caption: "Kasımpaşa's Recep Tayyip Erdoğan Stadium in a 2015 file photograph. The Istanbul ground is Tiemoko Diarra's new home venue after his July 2026 transfer.",
  },
  "live-20260716-emanuel-sharp-celtics-summer-league": {
    alt: "Sacramento Kings and San Antonio Spurs players during an NBA game",
    caption: "Sacramento Kings and San Antonio Spurs players during a 2012 NBA game. Emanuel Sharp joined the Kings organisation for the 2026 NBA Summer League; he is not shown in this earlier image.",
  },
  "live-20260715-israel-u20-greece": {
    alt: "The basketball court and stands inside Stožice Arena in Ljubljana",
    caption: "Stožice Arena in Ljubljana, the complex where Israel faced Greece in the 2026 FIBA U20 EuroBasket round of 16. File photograph.",
  },
  "live-20260716-noam-mocha-compensation": {
    alt: "The main stand and pitch at Yud-Alef Stadium in Ashdod",
    caption: "Yud-Alef Stadium in Ashdod, where Noam Mocha developed before joining Beitar Jerusalem. File photograph from 2023.",
  },
  "live-20260716-israel-u20-handball-faroe-islands": {
    alt: "The indoor court and stands at Cluj Polyvalent Hall in Romania",
    caption: "Cluj Polyvalent Hall in one of the two host cities of the 2026 M20 EHF EURO in Romania. Tournament-venue file photograph.",
  },
  "live-20260716-radinio-balker-huddersfield-extension": {
    alt: "Radinio Balker after a football match in July 2023",
    caption: "Radinio Balker after a football match in July 2023. File portrait used for his Huddersfield Town contract extension through 2028.",
  },
  "live-20260716-trump-world-cup-final-attendance": {
    alt: "Donald Trump speaking with the White House Task Force on the 2026 FIFA World Cup",
    caption: "US President Donald Trump meets the White House Task Force on the 2026 FIFA World Cup in November 2025. Official file photograph.",
  },
  "column-20260716-yehezkel-super-cup-width": {
    alt: "Maccabi Tel Aviv line up before a European match against Dynamo Kyiv",
    caption: "Maccabi Tel Aviv line up before a 2011 European match against Dynamo Kyiv. Club file photograph used for the tactical column on Sagiv Yehezkel's three-assist Super Cup display; Yehezkel is not shown.",
  },
  "live-20260717-kanichowsky-ferencvaros-twente": {
    alt: "Gabi Kanichowsky in action for Maccabi Netanya in February 2019",
    caption: "Gabi Kanichowsky playing for Maccabi Netanya on 5 February 2019. Exact-player file photograph from before his move to Ferencváros.",
  },
  "live-20260717-varsano-u18-record": {
    alt: "The track and main stand of the Stadio Raul Guidobaldi in Rieti",
    caption: "The Stadio Raul Guidobaldi in Rieti, venue of the 2026 European U18 Championships, in a February 2016 file photograph — an exact-venue image rather than a photograph of Varsano's race.",
  },
  "live-20260717-beitar-hapoel-ta-police-guidelines": {
    alt: "The curved exterior facade of the Netanya Stadium",
    caption: "The exterior of the Netanya Stadium in an April 2014 file photograph. Exact-venue image of the ground hosting Saturday's Beitar Jerusalem–Hapoel Tel Aviv meeting under the police matchday instructions.",
  },
  "live-20260717-rivollier-hapoel-return": {
    alt: "The exterior and curved roof of the HaMoshava Stadium in Petah Tikva",
    caption: "The exterior of the HaMoshava Stadium in Petah Tikva in a June 2016 file photograph — an exact-venue image of the ground Franck Rivollier returns to with Hapoel Petah Tikva.",
  },
  "live-20260717-abu-fani-red-star-macva50": {
    alt: "Mohammad Abu Fani during an Israel national team appearance in June 2023",
    caption: "Mohammad Abu Fani on Israel duty in June 2023. Exact-player file photograph from before his July 2026 Serbian league debut for Crvena Zvezda.",
  },
  "live-20260717-zaarura-russian-interest": {
    alt: "A panoramic view of the pitch and stands of the Netanya Stadium",
    caption: "The Netanya Stadium in a February 2014 panorama. Exact-venue file photograph of Maccabi Netanya's home ground; Basam Zaarura joined the club in 2023.",
  },
  "live-20260717-stilman-recanati-interview": {
    alt: "Maccabi Tel Aviv players in EuroLeague action against ALBA Berlin",
    caption: "Maccabi Tel Aviv in EuroLeague action against ALBA Berlin on 22 December 2022. Club file photograph from before the July 2026 ownership dispute.",
  },
  "live-20260718-sharp-kings-summer-league-finale": {
    alt: "The court and stands inside the Thomas and Mack Center in Las Vegas",
    caption: "The Thomas and Mack Center in Las Vegas, home of the NBA Summer League, in an undated file photograph. Exact-venue image for Sacramento's 92-90 win over Charlotte.",
  },
  "live-20260718-guildford-maccabi-ban-payout": {
    alt: "Villa Park's Trinity Road Stand seen from Trinity Road in Birmingham",
    caption: "Villa Park in Birmingham in a 2008 file photograph. Exact-venue image of the stadium at the centre of the November 2025 ban on Maccabi Tel Aviv supporters.",
  },
  "column-20260718-develop-and-sell-summer": {
    alt: "Aerial view of the Sammy Ofer Stadium in Haifa",
    caption: "The Sammy Ofer Stadium in Haifa in an aerial file photograph. Home of Maccabi Haifa, the club at the centre of this summer's reported record goalkeeper sale.",
  },
  "archive-20260718-montreal-1976": {
    alt: "Esther Roth-Shahamorov at an athletics evening in July 2013",
    caption: "Esther Roth-Shahamorov at an Israeli athletics evening in July 2013. Exact-person file photograph, taken decades after she carried Israel's black-ribboned flag in Montreal and became the country's first Olympic finalist.",
  },
  "live-20260718-sakhnin-balbarau": {
    alt: "The pitch and main stand of the Doha Stadium in Sakhnin",
    caption: "The Doha Stadium in Sakhnin, Bnei Sakhnin's home ground, in a file photograph. Exact-venue image for the club's signing of goalkeeper Raul Bălbărău.",
  },
  "live-20260718-varela-interest": {
    alt: "The renovated Bloomfield Stadium in Tel Aviv",
    caption: "The Bloomfield Stadium in Tel Aviv in a January 2022 file photograph. Exact-venue image of Maccabi Tel Aviv's home ground, where Hélio Varela is contracted until 2028.",
  },
  "live-20260718-abuhatzira-release-clause": {
    alt: "Maccabi Netanya players on the pitch during a match",
    caption: "Maccabi Netanya players in a February 2019 file photograph. Club-identity image from before Yarin Abuhatzira joined the academy.",
  },
  "live-20260718-show-kocaelispor-permanent": {
    alt: "The Kocaeli Stadium in Izmit, Turkey",
    caption: "The Kocaeli Stadium in İzmit in a 2025 file photograph. Exact-venue image of Kocaelispor's home ground, Show's destination after his permanent move from Maccabi Haifa.",
  },
  "live-20260718-tsunami-maccabi-haifa": {
    alt: "Wenderson Tsunami in action in February 2022",
    caption: "Wenderson Tsunami in a February 2022 file photograph from his Levski Sofia spell. Exact-player image from before his July 2026 move to Maccabi Haifa.",
  },
  "live-20260718-yermakov-metalist-record-sale": {
    alt: "The Metalist Stadium in Kharkiv",
    caption: "The Metalist Stadium in Kharkiv in a December 2011 file photograph. Exact-venue image of the ground of Metalist Kharkiv, Yermakov's reported destination.",
  },
  "live-20260718-koppel-referee-sponsorship-row": {
    alt: "Israeli top-flight referee Orel Grinfeld during a 2022 match",
    caption: "Israeli top-flight referee Orel Grinfeld during a 2022 match, in a file photograph. Exact-context image of the officials whose kit will carry the sponsorship at the centre of the row.",
  },
  "live-20260718-rogers-chelsea-record": {
    alt: "Morgan Rogers in action for England against Panama at the 2026 World Cup",
    caption: "Morgan Rogers playing for England against Panama at the 2026 World Cup on 27 June. Exact-player file photograph from weeks before his reported record move to Chelsea.",
  },
  "live-20260718-beitar-hapoel-ta-netanya-report": {
    alt: "A match in progress at the Netanya Stadium",
    caption: "A match in progress at the Netanya Stadium in an April 2014 file photograph. Exact-venue image of the neutral ground where Beitar Jerusalem beat Hapoel Tel Aviv 2-1.",
  },
  "live-20260718-israel-u20-latvia-rout": {
    alt: "The Stozice Arena complex in Ljubljana",
    caption: "The Stozice complex in Ljubljana in a file photograph. Exact-venue image of the arena grounds staging the FIBA U20 EuroBasket classification round.",
  },
  "live-20260719-france-england-bronze": {
    alt: "Bukayo Saka in action for England against Ghana at the 2026 World Cup",
    caption: "Bukayo Saka playing for England against Ghana at the 2026 World Cup on 23 June. Exact-player file photograph from earlier in the tournament he closed with a bronze-final double.",
  },
  "column-20260719-second-wave-youth-basketball": {
    alt: "Ben Saraf in EuroCup action for ratiopharm Ulm in October 2024",
    caption: "Ben Saraf in EuroCup action for ratiopharm Ulm in October 2024. Exact-player file photograph of the first-wave graduate now inside Brooklyn's NBA organisation.",
  },
  "archive-20260719-helsinki-1952": {
    alt: "Israel's first Olympic team before departing for the 1952 Helsinki Games",
    caption: "Israel's first Olympic team prepares to depart for Helsinki in 1952, in a Government Press Office photograph. Exact-subject image of the 25-strong delegation whose Games opened on 19 July 1952.",
  },
  "live-20260719-gadrani-beitar-standoff": {
    alt: "Beitar Jerusalem players during a 2016 pre-season match",
    caption: "Beitar Jerusalem in a June 2016 file photograph. Club-identity image from before Luka Gadrani's September 2025 arrival.",
  },
  "live-20260719-kerr-mile-world-record": {
    alt: "Josh Kerr winning the 5000m final at the 2025 UK Athletics Championships",
    caption: "Josh Kerr winning the 5000m final at the 2025 UK Athletics Championships. Exact-athlete file photograph from the year before his 3:42.66 mile world record.",
  },
  "live-20260719-datiashvili-youth-europeans": {
    alt: "ILCA 6 dinghies racing in open water",
    caption: "ILCA 6 dinghies racing in Weymouth Bay in a file photograph. Exact-class image of the boat in which Gaya Datiashvili finished seventh at the youth Europeans.",
  },
  "live-20260719-eli-ohana-farewell": {
    alt: "Eli Ohana at a ceremony in August 2017",
    caption: "Eli Ohana at the presidential Shield of Honor ceremony in August 2017, during his spell as Beitar Jerusalem chairman. Exact-person file photograph.",
  },
  "live-20260720-afriyie-injury": {
    alt: "Sprint starting blocks on an athletics track",
    caption: "Sprint starting blocks on the track; Israel's 100m record-holder Blessing Afrifah has been withdrawn from the national championships with a hamstring injury.",
  },
  "live-20260719-dowtin-napoli": {
    alt: "Napoli Basket in Serie A action",
    caption: "Napoli Basket in Serie A action during the 2024-25 season; the club has now unveiled ex-Maccabi Tel Aviv guard Jeff Dowtin Jr for its EuroCup return.",
  },
  "live-20260720-scaloni-departure": {
    alt: "Lionel Scaloni on the touchline for Argentina",
    caption: "Lionel Scaloni on the Argentina touchline at the 2024 Copa América; after the World Cup final defeat he committed only to seeing out his contract to December.",
  },
  "live-20260720-world-cup-final-spain-argentina": {
    alt: "Ferran Torres playing for Spain at the 2026 World Cup",
    caption: "Ferran Torres in Spain colours during the 2026 World Cup; his 106th-minute volley in the final beat Argentina and won Spain their second world title.",
  },
  "live-20260719-hapoel-ta-sofia-season-start": {
    alt: "Arena 8888 (formerly Arena Armeec) in Sofia",
    caption: "Arena 8888 in Sofia, formerly Arena Armeec, where Hapoel Tel Aviv staged their EuroLeague home games and will now open the new season.",
  },
  "live-20260719-tour-stage15-vingegaard": {
    alt: "Remco Evenepoel riding the Tour de France",
    caption: "Remco Evenepoel (in blue) rides alongside Tadej Pogacar at the 2025 Tour de France; on Sunday the pair fought out the summit finish on the Plateau de Solaison.",
  },
  "live-20260719-konfino-maccabi-ashdod": {
    alt: "Maccabi Ashdod playing at the HaKiriya Arena",
    caption: "Maccabi Ashdod on court at the HaKiriya Arena; the newly promoted club has appointed Noa Konfino as team manager for its top-flight return.",
  },
  "live-20260719-israel-u20-lithuania-eurobasket": {
    alt: "Arena Stožice in Ljubljana",
    caption: "Arena Stožice in Ljubljana, the FIBA U20 EuroBasket venue where Israel's under-20s closed their tournament against Lithuania.",
  },
  "live-20260719-atias-retirement": {
    alt: "Givat Ram Stadium in Jerusalem",
    caption: "Givat Ram Stadium in Jerusalem, where Ariel Atias will make the final start of his 16-year career at Monday's Israeli Championships.",
  },
  "live-20260719-lemkin-twente-interview": {
    alt: "A match under way at De Grolsch Veste, FC Twente's home stadium",
    caption: "Matchday at De Grolsch Veste, the stage where Stav Lemkin turned a difficult start into a regular starting place as Twente reached European football.",
  },
  "live-20260719-kangwa-aek-offer": {
    alt: "Kings Kangwa in Hapoel Be'er Sheva colours",
    caption: "Kings Kangwa in Hapoel Be'er Sheva colours; AEK Athens have now made an official offer for the champions' player of the season.",
  },
  "live-20260719-haziza-netanya": {
    alt: "Dolev Haziza on the pitch for Maccabi Haifa",
    caption: "Dolev Haziza during his Maccabi Haifa years; the former captain is expected to join Maccabi Netanya, the city of his birth.",
  },
  "live-20260719-martins-slovan-bratislava": {
    alt: "Cristian Martínez in action for Panama against England at the 2026 World Cup",
    caption: "Cristian Martínez playing for Panama against England at the 2026 World Cup, weeks before his move from Kiryat Shmona to Slovan Bratislava.",
  },
  "live-20260719-israel-u20-handball-world-championship": {
    alt: "The Horia Demian sports hall in Cluj-Napoca",
    caption: "The Horia Demian sports hall in Cluj-Napoca in a file photograph. Exact-venue image of the hall where Israel's under-20s beat Croatia 36:31 to qualify for the World Championship.",
  },
  "live-20260719-israel-relay-record-rieti": {
    alt: "Panoramic view of the Stadio Raul Guidobaldi in Rieti",
    caption: "The Stadio Raul Guidobaldi in Rieti in a February 2016 panorama. Exact-venue image of the track where Israel's under-18 quartet set the 1,000m relay record.",
  },
  "live-20260717-israel-u20-iceland-handball": {
    alt: "A capacity crowd watches a handball match at the Turda Arena in Romania",
    caption: "A handball fixture at the Turda Arena in a May 2025 file photograph. Exact-venue image of the hall staging the M20 EHF EURO placement round; the teams shown are not Israel and Iceland.",
  },

  "live-20260717-liam-hermesh-agrees-grazer-ak-move": {
    alt: "The stands and pitch of the Merkur Arena in Graz",
    caption: "The Merkur Arena in Graz in a March 2024 file photograph. Exact-venue image of Grazer AK's home ground awaiting Liam Hermesh.",
  },
  "live-20260717-france-world-cup-replay-petition-fifa-backs-referee": {
    alt: "Lamine Yamal in action for Spain in 2025",
    caption: "Lamine Yamal playing for Spain in a September 2025 file photograph. Exact-player image of the forward at the centre of the French handball complaint; this predates the 2026 semi-final.",
  },
  "live-20260717-police-announce-further-arrest-japanika-grenade-attacks": {
    alt: "The stands of Teddy Stadium in Jerusalem",
    caption: "Teddy Stadium in Jerusalem in a June 2013 file photograph. Home ground of Beitar Jerusalem, the club owned by Japanika proprietor Barak Abramov; the image is unrelated to the criminal investigation.",
  },
  "live-20260717-worko-beitar-debut-shua-doubt-carabali-commits": {
    alt: "Beitar Jerusalem players during a training session",
    caption: "Beitar Jerusalem players during a 2006 training session. Club archive file photograph; the current squad is not pictured.",
  },
  "live-20260717-red-star-glazer-fee-demand": {
    alt: "Omri Glazer in goal during his first Maccabi Haifa spell",
    caption: "Omri Glazer during his first spell at Maccabi Haifa, in a December 2016 file photograph. Exact-player image from the club he is reported to be rejoining.",
  },
  "live-20260717-kanyuk-ramat-gan-bonus-claim": {
    alt: "The pitch and stands of the Ramat Gan Stadium",
    caption: "The Ramat Gan Stadium in a file photograph. Exact-venue image for the pay dispute involving Hapoel Ramat Gan's promotion squad.",
  },
  "live-20260717-szoboszlai-signs-new-liverpool-deal-to-2031": {
    alt: "Dominik Szoboszlai in action in January 2026",
    caption: "Dominik Szoboszlai in a 4 January 2026 file photograph. Exact-player image from the season that preceded his new Liverpool contract.",
  },
  "live-20260717-orian-goren-tipped-to-cover-injured-de-jong-barcelona": {
    alt: "Aerial view of the Camp Nou in Barcelona",
    caption: "The Camp Nou in an aerial file photograph. Exact-club venue image for the reported pathway of La Masia midfielder Orian Goren; the player himself has no rights-cleared photograph on Commons.",
  },
  "live-20260717-us-analysts-warn-portland-morant-gamble-squeezes-avdija": {
    alt: "Deni Avdija walks upcourt alongside Wizards team-mate Rui Hachimura",
    caption: "Deni Avdija, number 9, alongside Washington team-mate Rui Hachimura in a February 2022 file photograph. Exact-player image predating his Portland move.",
  },
  "live-20260717-novakovich-profile-saief-reunion": {
    alt: "Panoramic view of the Sammy Ofer Stadium in Haifa",
    caption: "The Sammy Ofer Stadium in Haifa in a January 2015 file photograph. Exact-venue image of Andrija Novakovich's prospective home ground; a different frame from the player image on ILSP's transfer report.",
  },
  "live-20260717-levy-gal-470-junior-worlds-silver-gdynia": {
    alt: "A fleet of 470 dinghies crosses the start line of a race",
    caption: "A 470-class fleet at a race start in a file photograph. Exact-class image; the crews pictured are not the Israeli pair, and no rights-cleared photograph of Levy and Gal exists on Commons.",
  },
  "live-20260717-david-natan-obituary": {
    alt: "Israel play Wales at the Ramat Gan stadium in 1958",
    caption: "Israel against Wales at the Ramat Gan stadium in 1958, in a public-domain national-archive photograph from the era in which David Natan came through Ramat Gan football.",
  },
  "live-20260717-eissat-forced-off-eight-minutes-into-bristol-city-debut": {
    alt: "The South Stand at Ashton Gate, home of Bristol City",
    caption: "The South Stand at Ashton Gate in a September 2024 file photograph. Exact-venue image of Lisav Eissat's new home ground; his debut injury occurred at the club's training camp in Alicante.",
  },
  "live-20260717-hapoel-tel-aviv-close-in-on-jacob-toppin": {
    alt: "Jacob Toppin during a basketball game",
    caption: "Jacob Toppin in a file photograph from his American career. Exact-player image of the forward in reported talks with Hapoel Tel Aviv.",
  },
};

const wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

// Commons rate-limits bursts with HTTP 429. Retry the query endpoints with backoff
// so a shared runner IP (or a busy cycle) recovers instead of dropping the image.
async function commonsFetch(url) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const response = await fetch(url, { headers: { "User-Agent": userAgent } });
    if (response.ok) return response;
    if (response.status !== 429) throw new Error(`Commons API ${response.status}`);
    const retryAfter = Math.min(30, Number(response.headers.get("retry-after")) || (attempt + 1) * 5);
    await wait(retryAfter * 1000);
  }
  throw new Error("Commons API 429 after retries");
}
const stripHtml = (value = "") => value
  .replace(/<[^>]+>/g, " ")
  .replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&")
  .replace(/&#39;|&apos;/g, "'")
  .replace(/\s+/g, " ")
  .trim();

function allowedImage(page) {
  const info = page.imageinfo?.[0];
  const license = info?.extmetadata?.LicenseShortName?.value ?? "";
  return info?.mime === "image/jpeg"
    && Boolean(info.thumburl || info.url)
    && (/^CC(?:\s|0)/i.test(license) || /public domain/i.test(license));
}

function scorePage(page, query) {
  const info = page.imageinfo[0];
  const metadata = info.extmetadata ?? {};
  const haystack = `${page.title} ${stripHtml(metadata.ImageDescription?.value)} ${metadata.Categories?.value ?? ""}`.toLowerCase();
  const tokens = query.toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 3);
  let score = tokens.reduce((total, token) => total + (haystack.includes(token) ? 3 : 0), 0);
  if (/logo|flag|diagram|map|poster|autograph|audio|pronunciation|statue/i.test(page.title)) score -= 12;
  if (/cropped|match|game|stadium|player|team|tour|tennis|basketball|football/i.test(page.title)) score += 2;
  return score;
}

async function search(query, offset = 0) {
  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} -logo -flag`,
    gsrnamespace: "6",
    gsrlimit: "20",
    gsroffset: String(offset),
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata|size",
    iiurlwidth: "640",
    format: "json",
    formatversion: "2",
  });
  const response = await commonsFetch(`${api}?${params}`);
  const payload = await response.json();
  return (payload.query?.pages ?? []).filter(allowedImage).sort((a, b) => scorePage(b, query) - scorePage(a, query));
}

async function fetchFiles(titles) {
  const pages = new Map();
  for (let index = 0; index < titles.length; index += 50) {
    const params = new URLSearchParams({
      action: "query",
      titles: titles.slice(index, index + 50).join("|"),
      prop: "imageinfo",
      iiprop: "url|mime|extmetadata|size",
      iiurlwidth: "640",
      format: "json",
      formatversion: "2",
    });
    const response = await commonsFetch(`${api}?${params}`);
    const payload = await response.json();
    for (const page of (payload.query?.pages ?? []).filter(allowedImage)) pages.set(page.title, page);
    for (const normalized of payload.query?.normalized ?? []) {
      if (pages.has(normalized.to)) pages.set(normalized.from, pages.get(normalized.to));
    }
    if (index + 50 < titles.length) await wait(750);
  }
  return pages;
}

async function downloadImage(url, destination, replace = false) {
  if (!replace) {
    try {
      await access(destination);
      return false;
    } catch {
      // The file has not been imported yet.
    }
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": userAgent, Referer: "https://commons.wikimedia.org/" },
    });
    if (response.ok) {
      await writeFile(destination, Buffer.from(await response.arrayBuffer()));
      return true;
    }
    if (response.status !== 429) throw new Error(`image download ${response.status}`);
    const retryAfter = Math.min(8, Number(response.headers.get("retry-after")) || (attempt + 1) * 4);
    await wait(retryAfter * 1000);
  }
  throw new Error("image download 429 after retries");
}

function toAsset(article, page) {
  const info = page.imageinfo[0];
  const metadata = info.extmetadata ?? {};
  const description = stripHtml(metadata.ImageDescription?.value || metadata.ObjectName?.value || page.title.replace(/^File:/, "")).replace(/[.\s]+$/, "");
  const credit = stripHtml(metadata.Artist?.value || metadata.Credit?.value || "Wikimedia Commons contributor");
  const license = metadata.LicenseShortName?.value ?? "Creative Commons";
  const displayCredit = /wikimedia commons/i.test(credit) ? credit : `${credit} / Wikimedia Commons`;
  const copy = mediaCopy[article.id];
  return {
    fileName: `${article.slug}.jpg`,
    downloadUrl: info.thumburl || info.url,
    asset: {
      src: `/media/stories/${article.slug}.jpg`,
      alt: copy?.alt || description.slice(0, 180) || `File photograph related to ${article.title}`,
      caption: copy?.caption || `${description.slice(0, 220) || "Licensed sports file photograph"}. File photograph.`,
      credit: displayCredit.slice(0, 140),
      creditUrl: info.descriptionurl,
      license,
      licenseUrl: metadata.LicenseUrl?.value || "https://commons.wikimedia.org/wiki/Commons:Licensing",
      changes: "Resized and colour-treated; the full frame is preserved in the site layout.",
      width: info.thumbwidth || info.width || undefined,
      height: info.thumbheight || info.height || undefined,
    },
    selection: { articleId: article.id, article: article.title, query: queries[article.id], file: page.title, license },
  };
}

// Openverse — a second free source (aggregates CC/public-domain images from Flickr,
// museums and more). Used only when Commons has no unique match or is unavailable, so
// a single source can never block a story from publishing.
const openverseApi = "https://api.openverse.org/v1/images/";
async function openverseSearch(query) {
  const params = new URLSearchParams({ q: query, license: "by,by-sa,cc0,pdm", page_size: "20", mature: "false" });
  for (let attempt = 0; attempt < 4; attempt += 1) {
    let response;
    try {
      response = await fetch(`${openverseApi}?${params}`, { headers: { "User-Agent": userAgent } });
    } catch {
      return [];
    }
    if (response.ok) return (await response.json()).results ?? [];
    if (response.status !== 429) return [];
    await wait((attempt + 1) * 4000);
  }
  return [];
}
function openverseUsable(item) {
  const type = (item.filetype ?? "").toLowerCase();
  return Boolean(item.foreign_landing_url && item.url) && (type === "jpg" || type === "jpeg" || /\.jpe?g(?:$|\?)/i.test(item.url));
}
async function openversePick(searchQueries, usedUrlSet, tokens = []) {
  for (const query of searchQueries) {
    const results = await openverseSearch(query);
    const hit = results.find((item) => {
      if (!openverseUsable(item) || usedUrlSet.has(item.foreign_landing_url)) return false;
      if (!tokens.length) return true;
      const haystack = `${item.title ?? ""} ${(item.tags ?? []).map((tag) => tag.name).join(" ")}`.toLowerCase();
      return tokens.some((token) => haystack.includes(token.toLowerCase()));
    });
    if (hit) return hit;
    await wait(300);
  }
  return null;
}
function openverseToResult(article, item) {
  const copy = mediaCopy[article.id];
  const description = stripHtml(item.title ?? "").replace(/[.\s]+$/, "");
  const creator = stripHtml(item.creator ?? "Openverse contributor");
  const license = `${String(item.license ?? "CC").toUpperCase()}${item.license_version ? ` ${item.license_version}` : ""}`.trim();
  return {
    fileName: `${article.slug}.jpg`,
    downloadUrl: item.url,
    asset: {
      src: `/media/stories/${article.slug}.jpg`,
      alt: copy?.alt || description.slice(0, 180) || `File photograph related to ${article.title}`,
      caption: copy?.caption || `${description.slice(0, 220) || "Licensed sports file photograph"}. File photograph.`,
      credit: `${creator} / Openverse`.slice(0, 140),
      creditUrl: item.foreign_landing_url,
      license,
      licenseUrl: item.license_url || "https://openverse.org/",
      changes: "Resized and colour-treated; the full frame is preserved in the site layout.",
    },
    selection: { articleId: article.id, article: article.title, query: queries[article.id], source: "openverse", file: item.foreign_landing_url, license },
  };
}

const used = new Set();
// Never wipe existing curated media — always merge so a partial run or an API
// error can only ADD images, never drop the ones already sourced.
const media = { ...previousMedia };
// Enforce uniqueness against images ALREADY in the media map too (test 11 requires
// a distinct local file and source URL per published story), not just within this run.
const usedUrls = new Set(Object.values(previousMedia).map((asset) => asset.creditUrl).filter(Boolean));
const free = (page) => Boolean(page) && !used.has(page.pageid) && !usedUrls.has(page.imageinfo?.[0]?.descriptionurl);
const selections = [];
const failures = [];

if (!dryRun) await mkdir(outputDirectory, { recursive: true });
// Only pre-fetch the preferred files for the stories we are actually sourcing this
// run, so an incremental run makes a handful of calls instead of ~130 (the cause of
// Commons 429 rate-limiting when many single-article runs each prefetched them all).
const preferredPages = await fetchFiles(articles.map((article) => preferredFiles[article.id]).filter(Boolean));

// Words that do NOT identify a story's subject — sport nouns, competition words and
// common headline verbs/prepositions. What remains after removing these are the
// distinctive entities (Hapoel, Maccabi, Messi, Ludogorets, Pogacar, a surname, a
// venue) that an image must actually depict.
const GENERIC_WORDS = new Set(
  ("football soccer basketball handball volleyball tennis cycling athletics swimming rugby match matches game games fixture friendly stadium arena hall court pitch ground venue league leagues division cup supercup super world worlds europe european euro uefa fifa champions conference qualifier qualifiers qualifying playoff national team teams squad club clubs side player players star sign signs signed signing deal deals contract report reported reports reportedly claim claims interview transfer transfers move moves switch join joins joined loan loans coach coaching manager staff goalkeeper keeper striker forward guard defender midfielder record records breaks break broke youth academy junior senior women womens mens israeli israel abroad round rounds final finals semifinal opening season summer winter after with from through against over into ahead before waiting weigh weighs expanding expand rebuild rebuilds chasing close closes agrees agree verbal talks talk offer offers bonus release clause standoff return returns retire retirement debut appointment appointments appointed handed rout preview report city derby road runs pain silence patience compromise heartbreak reaction back path first second third fourth fifth new next set send sends tie ties tied loan compensation dispute row").split(/\s+/),
);
function articleTokens(article) {
  const source = `${article.title ?? ""} ${article.dek ?? ""}`;
  return [...new Set(
    source
      .split(/[^A-Za-zÀ-ÖØ-öø-ÿ']+/)
      .map((word) => word.replace(/'s$/i, "").replace(/'/g, "").trim())
      .filter((word) => word.length >= 4 && !GENERIC_WORDS.has(word.toLowerCase())),
  )];
}
function pageHaystack(page) {
  const info = page.imageinfo?.[0] ?? {};
  const metadata = info.extmetadata ?? {};
  return `${page.title ?? ""} ${stripHtml(metadata.ImageDescription?.value)} ${metadata.Categories?.value ?? ""}`.toLowerCase();
}
function relevant(haystack, tokens) {
  return tokens.some((token) => haystack.includes(token.toLowerCase()));
}

for (const [index, article] of articles.entries()) {
  const curated = Boolean(preferredFiles[article.id]);
  const tokens = articleTokens(article);
  // Search on the story's distinctive entities (club, player, person, competition,
  // venue) rather than the full headline sentence — a sentence matches generic
  // "football" images, entities match the actual subject.
  const primary = queries[article.id] ?? (tokens.slice(0, 5).join(" ") || article.title);
  let downloaded = false;
  try {
    // Only two TRUSTED, story-specific image sources are ever used:
    //   1. commonsCandidates — Commons files the drafting AI researched and matched
    //      to THIS exact story (verified relevant), and
    //   2. a hand-curated preferred file for this story.
    // Blind keyword search is deliberately NOT used: it matched coincidental words
    // (a city name, a first name, a substring) and put unrelated photos on stories.
    // If neither trusted source yields a usable image, the story is held for review
    // rather than published with a wrong one. The drafting step is responsible for
    // supplying good candidates so most stories still get an image automatically.
    let selected;
    try {
      // Models return the Commons file name under either "title" or "file"; accept
      // both. Fall back to deriving "File:<name>" from a commons.wikimedia.org URL.
      const candidateFiles = (article.commonsCandidates ?? [])
        .map((candidate) => {
          const named = candidate.title ?? candidate.file;
          if (typeof named === "string" && /^File:/i.test(named)) return named;
          const url = candidate.creditUrl ?? candidate.url ?? "";
          const match = typeof url === "string" && url.match(/\/wiki\/(File:[^?#]+)/i);
          return match ? decodeURIComponent(match[1]) : null;
        })
        .filter((title) => typeof title === "string" && /^File:/i.test(title));
      if (candidateFiles.length) {
        const candidatePages = await fetchFiles(candidateFiles);
        for (const title of candidateFiles) {
          const page = candidatePages.get(title);
          if (page && free(page)) { selected = page; break; }
        }
      }
      if (!selected && curated) {
        const page = preferredPages.get(preferredFiles[article.id]);
        if (page && free(page)) selected = page;
      }
    } catch {
      selected = undefined;
    }
    if (!selected) throw new Error("no AI-verified or curated image for this story — held for review");
    used.add(selected.pageid);
    usedUrls.add(selected.imageinfo?.[0]?.descriptionurl);
    const result = toAsset(article, selected);
    if (!dryRun) {
      // Overwrite the file unless it is already the SAME image (same source URL).
      // We only reach here for stories being (re)sourced, so a file left at this
      // slug from an earlier run is stale — never keep it, or the page would show
      // the old wrong photo while the metadata claims the new one. (This was the
      // bug: a skipped download left a 1946 match photo under a Bloomfield caption.)
      const previous = previousMedia[article.id];
      const alreadyCorrect = previous && previous.creditUrl === result.asset.creditUrl;
      downloaded = await downloadImage(
        result.downloadUrl,
        path.join(outputDirectory, result.fileName),
        !alreadyCorrect,
      );
    }
    media[article.id] = result.asset;
    selections.push(result.selection);
  } catch (error) {
    failures.push({ id: article.id, title: article.title, error: error instanceof Error ? error.message : String(error) });
  }
  await wait(dryRun ? 250 : downloaded ? 3000 : 0);
}

if (!dryRun) await writeFile(path.join(root, "data/article-media.json"), `${JSON.stringify(media, null, 2)}\n`);
await writeFile(path.join(root, "data/media-selection-report.json"), `${JSON.stringify({ selections, failures }, null, 2)}\n`);
process.stdout.write(`${JSON.stringify({ selected: selections.length, failures: failures.length, dryRun })}\n`);
if (failures.length) process.exitCode = 1;
