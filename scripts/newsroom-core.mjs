import crypto from "node:crypto";

const namedEntities = {
  amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " ",
  ndash: "–", mdash: "—", hellip: "…", rsquo: "’", lsquo: "‘",
  rdquo: "”", ldquo: "“",
};

export function decodeHtml(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, decimal) => String.fromCodePoint(Number(decimal)))
    .replace(/&([a-z]+);/gi, (match, name) => namedEntities[name.toLowerCase()] ?? match);
}

export function stripHtml(value = "") {
  return decodeHtml(
    value
      .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/\s*\n\s*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function metaContent(html, key, value) {
  const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+${key}=["']${escaped}["'][^>]+content=["']([^"']*)["'][^>]*>`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+${key}=["']${escaped}["'][^>]*>`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return decodeHtml(match[1]).trim();
  }
  return "";
}

export function extractMetadata(html, url) {
  const titleTag = stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "");
  const title = [
    metaContent(html, "property", "og:title"),
    metaContent(html, "name", "twitter:title"),
    metaContent(html, "name", "title"),
    titleTag,
  ].filter(Boolean).sort((left, right) => right.length - left.length)[0] ?? "";
  const canonical = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["']/i)?.[1]
    ?? html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["']canonical["']/i)?.[1]
    ?? url;
  const published = metaContent(html, "property", "article:published_time")
    || metaContent(html, "name", "date")
    || html.match(/"datePublished"\s*:\s*"([^"]+)"/i)?.[1]
    || "";
  const author = metaContent(html, "name", "author")
    || html.match(/"author"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/i)?.[1]
    || "";
  return {
    url: new URL(canonical, url).toString(),
    title,
    description: metaContent(html, "property", "og:description") || metaContent(html, "name", "description"),
    image: metaContent(html, "property", "og:image") || metaContent(html, "name", "twitter:image"),
    publishedAt: published,
    author: decodeHtml(author),
  };
}

export function extractArticleText(html, maxCharacters = 12_000) {
  const jsonBody = html.match(/"articleBody"\s*:\s*"((?:\\.|[^"\\])*)"/i)?.[1];
  if (jsonBody) {
    try { return JSON.parse(`"${jsonBody}"`).slice(0, maxCharacters); } catch { /* use body fallback */ }
  }
  const article = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1]
    ?? html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1]
    ?? html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1]
    ?? html;
  return stripHtml(article).slice(0, maxCharacters);
}

export function extractLinks(html, baseUrl, hints = [], allowedHosts = []) {
  const base = new URL(baseUrl);
  const hosts = new Set([base.hostname, ...allowedHosts.map((host) => host.toLowerCase())]);
  const links = [];
  const seen = new Set();
  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    try {
      const url = new URL(decodeHtml(match[1]), base);
      url.hash = "";
      if (!hosts.has(url.hostname.toLowerCase()) && !url.hostname.endsWith(`.${base.hostname}`)) continue;
      if (hints.length && !hints.some((hint) => `${url.pathname}${url.search}`.toLowerCase().includes(hint.toLowerCase()))) continue;
      const clean = url.toString();
      if (seen.has(clean)) continue;
      const anchor = stripHtml(match[2]);
      if (anchor.length < 8) continue;
      seen.add(clean);
      links.push({ url: clean, anchor });
    } catch { /* skip malformed links */ }
  }
  return links;
}

export function extractFeedLinks(xml, baseUrl) {
  const links = [];
  const seen = new Set();
  for (const block of xml.matchAll(/<(?:url|urlset:item|item|entry)\b[^>]*>([\s\S]*?)<\/(?:url|urlset:item|item|entry)>/gi)) {
    const content = block[1];
    const rawUrl = content.match(/<(?:loc|link)>\s*(?:<!\[CDATA\[)?([^<\]]+)/i)?.[1]
      ?? content.match(/<link[^>]+href=["']([^"']+)/i)?.[1];
    if (!rawUrl) continue;
    try {
      const url = new URL(decodeHtml(rawUrl.trim()), baseUrl).toString();
      if (seen.has(url)) continue;
      seen.add(url);
      const title = stripHtml(content.match(/<(?:news:title|title)>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:news:title|title)>/i)?.[1] ?? "");
      const publishedAt = stripHtml(content.match(/<(?:news:publication_date|pubDate|published|updated|lastmod)>\s*(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/(?:news:publication_date|pubDate|published|updated|lastmod)>/i)?.[1] ?? "");
      const image = decodeHtml(
        content.match(/<(?:media:content|enclosure|image:loc)[^>]+(?:url|href)=["']([^"']+)/i)?.[1]
          ?? content.match(/<image:loc>\s*(?:<!\[CDATA\[)?([^<\]]+)/i)?.[1]
          ?? "",
      );
      links.push({ url, anchor: title || url, publishedAt, image });
    } catch { /* skip malformed feed entries */ }
  }
  if (!links.length) {
    for (const match of xml.matchAll(/<loc>\s*(?:<!\[CDATA\[)?([^<\]]+)/gi)) {
      try {
        const url = new URL(decodeHtml(match[1].trim()), baseUrl).toString();
        if (!seen.has(url)) { seen.add(url); links.push({ url, anchor: url, publishedAt: "", image: "" }); }
      } catch { /* skip malformed sitemap URL */ }
    }
  }
  return links;
}

export function extractOneHomepageLinks(payload, articleBase = "https://www.one.co.il") {
  const categories = payload?.Data?.Articles?.Categories ?? [];
  const links = [];
  const seen = new Set();
  for (const category of categories) {
    for (const item of category?.Items ?? []) {
      if (!item?.ID || item.IsVideo || item.IsLive || item.Meta?.ONE?.IsAd) continue;
      const title = decodeHtml(item.Title?.Main ?? "").trim();
      if (title.length < 8 || seen.has(String(item.ID))) continue;
      seen.add(String(item.ID));
      links.push({ url: new URL(`/Article/${item.ID}.html`, articleBase).toString(), anchor: title });
    }
  }
  return links;
}

export function normalizeTitle(value = "") {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function titleSimilarity(a, b) {
  const left = new Set(normalizeTitle(a).split(" ").filter((word) => word.length > 2));
  const right = new Set(normalizeTitle(b).split(" ").filter((word) => word.length > 2));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((word) => right.has(word)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

export function isDuplicate(candidate, articles, threshold = 0.72) {
  return articles.some((article) =>
    article.source?.url === candidate.url
      || (candidate.dedupeKey && article.dedupeKey && (
        normalizeTitle(candidate.dedupeKey) === normalizeTitle(article.dedupeKey)
        || titleSimilarity(article.dedupeKey, candidate.dedupeKey) >= 0.62
      ))
      || titleSimilarity(article.title, candidate.title) >= threshold
      || (article.source?.originalTitle && titleSimilarity(article.source.originalTitle, candidate.title) >= threshold),
  );
}

export function slugify(value) {
  const slug = normalizeTitle(value).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 90);
  return slug || `story-${crypto.randomBytes(4).toString("hex")}`;
}

export function parseRobots(robotsText, targetUrl, userAgent = "*") {
  if (!robotsText.trim()) return true;
  const target = new URL(targetUrl);
  const rules = [];
  let agents = [];
  for (const rawLine of robotsText.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.toLowerCase().trim();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      if (rules.length) agents = [];
      agents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && agents.some((agent) => agent === "*" || userAgent.toLowerCase().includes(agent))) {
      if (value) rules.push({ type: key, path: value });
    }
  }
  const path = `${target.pathname}${target.search}`;
  const matching = rules
    .filter((rule) => {
      const escaped = rule.path.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*").replace(/\$$/, "$");
      return new RegExp(`^${escaped}`).test(path);
    })
    .sort((a, b) => b.path.replace(/\*/g, "").length - a.path.replace(/\*/g, "").length);
  return matching[0]?.type !== "disallow";
}

export function buildNamebookPrompt(namebook) {
  const entries = [...namebook.clubs, ...namebook.people]
    .map((item) => `${item.hebrew} (${(item.aliases ?? []).join(", ")}) → ${item.english} [${item.verifiedBy}]`)
    .join("\n");
  const terms = namebook.terms.map((term) => `${term.hebrew} → ${term.english}. ${term.note}`).join("\n");
  return `VERIFIED IDENTITY NAMEBOOK\n${entries}\n\nSPORTS TERMINOLOGY\n${terms}`;
}

export function responseText(payload) {
  if (typeof payload.output_text === "string") return payload.output_text;
  return (payload.output ?? [])
    .flatMap((item) => item.content ?? [])
    .filter((item) => item.type === "output_text" && typeof item.text === "string")
    .map((item) => item.text)
    .join("");
}
