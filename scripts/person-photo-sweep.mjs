// Eenmalige/herhaalbare sweep (eigenaarseis 29 jul): elk gepubliceerd verhaal
// over een PERSOON krijgt een foto van die persoon. Voor elke verdachte story
// zoekt dit script Commons-bestanden waarvan de BESTANDSNAAM de persoonsnaam
// bevat (sterk signaal, geen blinde keyword-matches), met poorten: uniek,
// niet-vintage, ≥500px. Alleen bij een treffer wordt de oude foto vervangen.
import { readFileSync, writeFileSync, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const api = "https://commons.wikimedia.org/w/api.php";
const UA = { "user-agent": "IsraelSportsPulse/1.0 (editorial photo sweep)" };
const MIN_W = 500;
const VINTAGE = /government press office|\bgpo\b|fortepan|bundesarchiv|nationaal archief|\b(19[0-9]{2}|200[0-4])\b/i;
const STOP = new Set("Maccabi Hapoel Ironi Beitar Bnei Tel Aviv Haifa Jerusalem Shmona Kiryat Sakhnin Tiberias Netanya Israel Israeli Toto Cup League Liga Ligat United City Real Madrid Barcelona Union Saint Gilloise Nottingham Forest EuroLeague NBA UEFA FIFA Champions Europa Conference World Group Round FC AFC The Golden Ball European Championships Abu Dhabi".split(/\s+/));

const namesOf = (title) => {
  const tokens = (title ?? "").split(/[^A-Za-zÀ-ÖØ-öø-ÿ'’-]+/).filter(Boolean);
  const names = []; let run = [];
  for (const t of tokens) {
    if (/^[A-ZÀ-Ö]/.test(t) && t.length >= 2 && !STOP.has(t)) run.push(t);
    else { if (run.length >= 2) names.push(run.join(" ")); run = []; }
  }
  if (run.length >= 2) names.push(run.join(" "));
  return names;
};

const articles = JSON.parse(readFileSync(path.join(root, "data/articles.json"), "utf8"));
const media = JSON.parse(readFileSync(path.join(root, "data/article-media.json"), "utf8"));
const usedUrls = new Set(Object.values(media).map((m) => m.creditUrl));
const targets = JSON.parse(readFileSync(process.env.SWEEP_INPUT ?? "/tmp/ilsp-suspects.json", "utf8"));
const byId = new Map(articles.map((a) => [a.id, a]));

let replaced = 0, unmatched = [];
for (const id of targets) {
  const article = byId.get(id);
  if (!article) continue;
  const names = namesOf(article.title);
  let done = false;
  for (const name of names) {
    if (done) break;
    try {
      const params = new URLSearchParams({ action: "query", list: "search", srnamespace: "6", srlimit: "12", format: "json", maxlag: "5", srsearch: `intitle:"${name}"` });
      const hits = (((await (await fetch(`${api}?${params}`, { headers: UA })).json()).query ?? {}).search ?? [])
        .map((h) => h.title)
        .filter((t) => t.toLowerCase().includes(name.toLowerCase()) && /\.(jpe?g|png)$/i.test(t));
      if (!hits.length) continue;
      const ip = new URLSearchParams({ action: "query", prop: "imageinfo", iiprop: "url|size|extmetadata|mime", format: "json", titles: hits.join("|") });
      const pages = Object.values((((await (await fetch(`${api}?${ip}`, { headers: UA })).json()).query ?? {}).pages ?? {}));
      for (const title of hits) {
        const page = pages.find((p) => p.title === title);
        const ii = page?.imageinfo?.[0];
        if (!ii || ii.width < MIN_W) continue;
        if (usedUrls.has(ii.descriptionurl)) continue;
        const meta = ii.extmetadata ?? {};
        if (VINTAGE.test(`${title} ${meta.DateTimeOriginal?.value ?? ""} ${meta.ImageDescription?.value ?? ""}`)) continue;
        const license = (meta.LicenseShortName?.value ?? "").trim();
        if (!license || /copyright|non-free/i.test(license)) continue;
        const slugFile = `${article.slug}.jpg`;
        const out = path.join(root, "public/media/stories", slugFile);
        const res = await fetch(ii.url.replace(/^http:/, "https:"), { headers: UA });
        if (!res.ok) continue;
        await pipeline(res.body, createWriteStream(out));
        const artist = (meta.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() || "Wikimedia Commons";
        media[id] = {
          src: `/media/stories/${slugFile}`,
          alt: `${name}`,
          caption: `${name}. File photograph.`,
          credit: `${artist} / Wikimedia Commons`,
          creditUrl: ii.descriptionurl,
          license,
          licenseUrl: (meta.LicenseUrl?.value ?? "https://commons.wikimedia.org/wiki/Commons:Licensing").trim(),
          changes: "Resized and colour-treated; the full frame is preserved in the site layout.",
          width: ii.width, height: ii.height,
        };
        usedUrls.add(ii.descriptionurl);
        console.log(`✓ ${id} → ${title}`);
        replaced += 1; done = true;
        break;
      }
      await new Promise((r) => setTimeout(r, 2600));
    } catch (error) { console.log(`? ${id}: ${error.message.slice(0, 60)}`); }
  }
  if (!done) unmatched.push(id);
}
writeFileSync(path.join(root, "data/article-media.json"), `${JSON.stringify(media, null, 2)}\n`);
writeFileSync("/tmp/ilsp-unmatched.json", JSON.stringify(unmatched, null, 1));
console.log(`Klaar: ${replaced} vervangen door echte persoonsfoto's; ${unmatched.length} zonder Commons-treffer (lijst: /tmp/ilsp-unmatched.json).`);
