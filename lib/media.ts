import articleMediaJson from "@/data/article-media.json";
import type { Article, MediaAsset } from "@/lib/types";

const articleMedia = articleMediaJson as Record<string, MediaAsset>;

const bloomfield: MediaAsset = {
  src: "/media/bloomfield-stadium.jpg",
  alt: "Bloomfield Stadium in Tel Aviv under floodlights",
  caption: "Bloomfield Stadium file photograph; this image does not depict the reported event.",
  credit: "LeRenartQuiPense / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Bloomfield_stadium_Tel_Aviv.jpg",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const basketball: MediaAsset = {
  src: "/media/maccabi-basketball.jpg",
  alt: "Players and coaches beside an Israeli basketball court",
  caption: "Israeli basketball file photograph; this image does not depict the reported event.",
  credit: "Orrling / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Maccabi_Tel_Aviv.jpg",
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const teddy: MediaAsset = {
  src: "/media/teddy-stadium.jpg",
  alt: "Teddy Stadium in Jerusalem during a football match",
  caption: "Teddy Stadium file photograph; this image does not depict the reported event.",
  credit: "Dindia / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Teddy_Stadium,_Jerusalem_(cropped).jpg",
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const turner: MediaAsset = {
  src: "/media/turner-stadium.jpg",
  alt: "Turner Stadium in Beersheba",
  caption: "Turner Stadium file photograph; this image does not depict the reported event.",
  credit: "Little Savage / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Turner_Stadium_05.jpg",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const deniAvdija: MediaAsset = {
  src: "/media/deni-avdija.jpg",
  alt: "Deni Avdija playing for Israel at a youth basketball tournament",
  caption: "Deni Avdija playing for Israel in 2018; archival file photograph.",
  credit: "Sven Mandel / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Deni_Avdija.jpg",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const jannikSinner: MediaAsset = {
  src: "/media/jannik-sinner.jpg",
  alt: "Jannik Sinner playing tennis in Antwerp",
  caption: "Jannik Sinner at the 2019 European Open; archival file photograph.",
  credit: "Beireke1 / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Jannik_Sinner_(cropped).jpg",
  license: "CC0",
  licenseUrl: "https://creativecommons.org/publicdomain/zero/1.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const maccabiah: MediaAsset = {
  src: "/media/maccabiah-light-show.jpg",
  alt: "Light show at a Maccabiah Games opening ceremony",
  caption: "Opening ceremony of the 2013 Maccabiah; archival file photograph.",
  credit: "Maor X / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Light_show_at_the_opening_of_the_Maccabiah_Games_2013.JPG",
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const lamineYamal: MediaAsset = {
  src: "/media/lamine-yamal.jpg",
  alt: "Lamine Yamal representing Spain",
  caption: "Lamine Yamal with Spain in 2025; archival file photograph.",
  credit: "Biso / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Lamine_Yamal_in_2025_(cropped2).jpg",
  license: "CC BY 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by/4.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const neymar: MediaAsset = {
  src: "/media/neymar-football.jpg",
  alt: "Neymar playing for Paris Saint-Germain in the French Cup",
  caption: "Neymar playing for Paris Saint-Germain in 2023; archival file photograph.",
  credit: "Liondartois / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Cassel_vs_PSG_(Coupe_de_France_2023).jpg",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const ronaldoMadeira: MediaAsset = {
  src: "/media/ronaldo-madeira.jpg",
  alt: "Cristiano Ronaldo museum and statue at Funchal harbour in Madeira",
  caption: "The Cristiano Ronaldo museum and statue in Funchal, Madeira; 2024 file photograph.",
  credit: "Asurnipal / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Madeira-Funchal-harbour-Pestana_CR7_Hotel-Cristiano_Ronaldo_Museu-statue-03ASD.jpg",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const cycling: MediaAsset = {
  src: "/media/tour-de-france-peloton.jpg",
  alt: "Tour de France peloton racing through a mountain stage",
  caption: "Tour de France 2025 file photograph; this image does not depict the reported event.",
  credit: "Hugo LUC / Wikimedia Commons",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Peloton_of_Tour_de_France_2025_in_Ger_during_stage_12.jpg",
  license: "CC BY-SA 4.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

const olympics: MediaAsset = {
  src: "/media/olympic-athletics.jpg",
  alt: "Athletes racing inside an Olympic stadium",
  caption: "Athletics at the Sydney 2000 Olympic Games; archival file photograph.",
  credit: "Wikimedia Commons contributor",
  creditUrl: "https://commons.wikimedia.org/wiki/File:Sydney_olympic_stadium_track_and_field.jpg",
  license: "CC BY-SA 3.0",
  licenseUrl: "https://creativecommons.org/licenses/by-sa/3.0/",
  changes: "Cropped and colour-treated in the site layout.",
};

type ArticleWithVisual = Pick<Article, "id" | "title" | "dek" | "category" | "image">;

export function getArticleImage(article: ArticleWithVisual): MediaAsset {
  if (articleMedia[article.id]) return articleMedia[article.id];
  if (article.image) return article.image;

  const text = `${article.title} ${article.dek}`.toLowerCase();
  if (text.includes("maccabiah")) return maccabiah;
  if (text.includes("sinner") || text.includes("wimbledon")) return jannikSinner;
  if (text.includes("avdija") || text.includes("portland")) return deniAvdija;
  if (text.includes("neymar")) return neymar;
  if (text.includes("ronaldo") || text.includes("madeira")) return ronaldoMadeira;
  if (text.includes("yamal") || text.includes("spain") || text.includes("france")) return lamineYamal;
  if (text.includes("beitar")) return teddy;
  if (text.includes("be’er sheva") || text.includes("beer sheva") || text.includes("hapoel b")) return turner;
  if (article.category === "Cycling") return cycling;
  if (article.category === "Olympics" || article.category.includes("Olympic")) return olympics;
  if (article.category === "Tennis") return jannikSinner;
  if (article.category.includes("Basketball") || article.category === "NBA" || (article.category.includes("Youth Sport") && text.includes("basketball"))) return basketball;
  return bloomfield;
}
