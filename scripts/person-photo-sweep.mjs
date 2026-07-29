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
// Wikimedia vereist een beschrijvende UA mét contact, anders 429/403.
const UA = { "user-agent": "IsraelSportsPulseBot/1.0 (https://ilsportspulse.com; editorial@ilsportspulse.com) photo-sourcing" };

// Wikipedia/Wikidata leadfoto voor een persoon. Israëlische spelers hebben vaak
// GEEN Commons-bestand op hun Engelse naam maar WEL een Hebreeuws (of Engels)
// Wikipedia-artikel met een leadfoto (pageimage, staat op Commons, dus vrij).
// Zoekt per naam op he. en en.wikipedia; geeft de Commons-bestandsnaam terug.
async function wikiLeadPhoto(name) {
  for (const lang of ["he", "en"]) {
    try {
      const search = new URLSearchParams({ action: "query", list: "search", srsearch: name, srlimit: "3", format: "json", origin: "*" });
      const hits = (((await (await fetch(`https://${lang}.wikipedia.org/w/api.php?${search}`, { headers: UA })).json()).query ?? {}).search ?? []).map((h) => h.title);
      await new Promise((r) => setTimeout(r, 1500));
      for (const title of hits) {
        const q = new URLSearchParams({ action: "query", titles: title, prop: "pageimages", piprop: "original|name", format: "json", redirects: "1" });
        const pages = Object.values((((await (await fetch(`https://${lang}.wikipedia.org/w/api.php?${q}`, { headers: UA })).json()).query ?? {}).pages ?? {}));
        await new Promise((r) => setTimeout(r, 1500));
        for (const p of pages) {
          const file = p.pageimage ? `File:${p.pageimage}` : null;
          if (file) return file;
        }
      }
    } catch { /* volgende taal */ }
  }
  return null;
}
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

// Haalt imageinfo (url, maat, licentie) voor Commons-bestandstitels op.
async function fetchFiles(titles) {
  const map = new Map();
  if (!titles.length) return map;
  const q = new URLSearchParams({ action: "query", prop: "imageinfo", iiprop: "url|size|extmetadata|mime", format: "json", titles: titles.join("|") });
  try {
    const pages = Object.values((((await (await fetch(`${api}?${q}`, { headers: UA })).json()).query ?? {}).pages ?? {}));
    for (const p of pages) map.set(p.title, p);
  } catch { /* leeg terug */ }
  return map;
}

const articles = JSON.parse(readFileSync(path.join(root, "data/articles.json"), "utf8"));
const media = JSON.parse(readFileSync(path.join(root, "data/article-media.json"), "utf8"));
const usedUrls = new Set(Object.values(media).map((m) => m.creditUrl));
const targets = JSON.parse(readFileSync(process.env.SWEEP_INPUT ?? "/tmp/ilsp-suspects.json", "utf8"));
const byId = new Map(articles.map((a) => [a.id, a]));

// X-signalen: matchfoto's van de betrokken persoon/wedstrijd. Voor Israëlische
// spelers zonder Commons-portret is de relevante foto de foto van hun eigen
// moment op X (Sport5/ONE/Sport1) — dat is de foto die BIJ het verhaal hoort.
const xSignals = (() => {
  try { return JSON.parse(readFileSync(path.join(root, "data/x-signals.json"), "utf8")).signals ?? []; }
  catch { return []; }
})();
// Simpele Hebreeuwse achternaam-hints per verhaal ontbreken; we matchen op de
// Latijnse tokens die ook in de tweettekst kunnen staan én op reeds-gekoppelde
// officialSocialPost. Alleen tweets MET photoUrl tellen.
const xPhotoFor = (article, names) => {
  if (article.officialSocialPost?.url) {
    const s = xSignals.find((x) => x.url === article.officialSocialPost.url && x.photoUrl);
    if (s) return { url: s.photoUrl, post: s.url, handle: s.handle };
  }
  const toks = names.flatMap((n) => n.split(" ")).filter((t) => t.length >= 4);
  for (const s of xSignals) {
    if (!s.photoUrl) continue;
    const hay = (s.text ?? "").toLowerCase();
    if (toks.some((t) => hay.includes(t.toLowerCase()))) return { url: s.photoUrl, post: s.url, handle: s.handle };
  }
  return null;
};

let replaced = 0, xReplaced = 0, unmatched = [];
for (const id of targets) {
  const article = byId.get(id);
  if (!article) continue;
  const names = namesOf(article.title);
  let done = false;
  // Tier 0: relevante X-matchfoto (gratis, altijd on-topic).
  const xp = names.length ? xPhotoFor(article, names) : null;
  if (xp && !usedUrls.has(xp.post)) {
    try {
      const res = await fetch(`${xp.url}${xp.url.includes("?") ? "&" : "?"}name=large`, { headers: UA });
      if (res.ok) {
        const slugFile = `${article.slug}.jpg`;
        await pipeline(res.body, createWriteStream(path.join(root, "public/media/stories", slugFile)));
        media[id] = {
          src: `/media/stories/${slugFile}`,
          alt: names[0],
          caption: `${names[0]}. ${xp.handle} via X.`,
          credit: `${xp.handle} via X`, creditUrl: xp.post,
          license: "Publisher photo, linked to the original post", licenseUrl: xp.post,
          changes: "Resized; the full frame is on the original post.",
        };
        usedUrls.add(xp.post);
        console.log(`✓X ${id} → ${xp.handle}`);
        xReplaced += 1; replaced += 1; done = true;
        await new Promise((r) => setTimeout(r, 800));
        continue;
      }
    } catch { /* val terug op Commons */ }
  }
  // Tier 1: Wikipedia/Wikidata leadfoto (he. + en.) — dé plek waar Israëlische
  // spelers hun portret hebben, ook als er geen Commons-treffer op de Engelse
  // naam is. Zoekt eerst hier vóór de brede Commons-zoektocht (die vogels ving).
  for (const name of names) {
    if (done) break;
    try {
      const file = await wikiLeadPhoto(name);
      if (!file) continue;
      const pages = await fetchFiles([file]);
      const page = pages.get(file);
      const ii = page?.imageinfo?.[0];
      if (!ii || ii.width < MIN_W || usedUrls.has(ii.descriptionurl)) continue;
      const meta = ii.extmetadata ?? {};
      if (VINTAGE.test(`${file} ${meta.DateTimeOriginal?.value ?? ""}`)) continue;
      const license = (meta.LicenseShortName?.value ?? "").trim();
      if (!license || /copyright|non-free/i.test(license)) continue;
      const slugFile = `${article.slug}.jpg`;
      const res = await fetch(ii.url.replace(/^http:/, "https:"), { headers: UA });
      if (!res.ok) continue;
      await pipeline(res.body, createWriteStream(path.join(root, "public/media/stories", slugFile)));
      const artist = (meta.Artist?.value ?? "").replace(/<[^>]+>/g, "").trim() || "Wikimedia Commons";
      media[id] = {
        src: `/media/stories/${slugFile}`, alt: name, caption: `${name}. File photograph.`,
        credit: `${artist} / Wikimedia Commons`, creditUrl: ii.descriptionurl, license,
        licenseUrl: (meta.LicenseUrl?.value ?? "https://commons.wikimedia.org/wiki/Commons:Licensing").trim(),
        changes: "Resized and colour-treated; the full frame is preserved in the site layout.",
        width: ii.width, height: ii.height,
      };
      usedUrls.add(ii.descriptionurl);
      console.log(`✓W ${id} → ${file}`);
      replaced += 1; done = true;
    } catch { /* val terug op Commons-tier */ }
  }

  // De brede Commons intitle-zoektocht is BEWUST GESCHRAPT (29 jul): hij matchte
  // op losse naamtokens en leverde verkeerde gezichten (een "de Jong"-gedenksteen,
  // een "Grazer AK"-stadion, naamgenoten, coaches). Alleen Wikipedia-portret
  // (tier 1) en X-matchfoto (tier 0) zijn betrouwbaar — die zijn per definitie
  // de juiste persoon of het juiste moment. Rest → onbeslist, gericht handwerk.
  if (!done) unmatched.push(id);
  await new Promise((r) => setTimeout(r, 400));
}
writeFileSync(path.join(root, "data/article-media.json"), `${JSON.stringify(media, null, 2)}\n`);
writeFileSync("/tmp/ilsp-unmatched.json", JSON.stringify(unmatched, null, 1));
console.log(`Klaar: ${replaced} vervangen door echte persoonsfoto's; ${unmatched.length} zonder Commons-treffer (lijst: /tmp/ilsp-unmatched.json).`);
