import { siteConfig } from "@/config/site";

// Best-effort IndexNow ping (Bing, Yandex, and others consume it) so freshly
// published/updated URLs get crawled fast. No-op unless INDEXNOW_KEY is set and
// the matching key file is hosted at https://<host>/<key>.txt.
export async function pingIndexNow(paths: string[]): Promise<void> {
  const key = process.env.INDEXNOW_KEY;
  if (!key || paths.length === 0) return;
  const base = siteConfig.siteUrl.replace(/\/$/, "");
  const host = new URL(base).host;
  const urlList = paths.map((p) => (p.startsWith("http") ? p : `${base}${p}`));
  try {
    await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host, key, keyLocation: `${base}/${key}.txt`, urlList }),
    });
  } catch {
    /* best-effort — never block publishing on a ping failure */
  }
}
