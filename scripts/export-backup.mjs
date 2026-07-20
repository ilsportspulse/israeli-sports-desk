// Scheduled content backup: bundles all backoffice-managed content + config into a
// single timestamped JSON snapshot under backups/. Intended to run on a schedule
// and be shipped to off-site, versioned, encrypted object storage (retain 30–90d).
// Git history is the primary backup; this is the layered, portable second copy.

import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dataDir = path.join(root, "data");
const outDir = path.join(root, "backups");

const FILES = [
  "articles.json", "article-media.json", "redirects.json", "settings.json",
  "corrections.json", "taxonomy.json", "social.json", "social-posts.json",
  "affiliation.json", "community.json", "notifications-config.json",
  "locale-config.json", "newsroom-log.json",
];

async function readJsonSafe(name) {
  try { return JSON.parse(await readFile(path.join(dataDir, name), "utf8")); }
  catch { return null; }
}

const stamp = process.env.BACKUP_STAMP || new Date().toISOString().replace(/[:.]/g, "-");
const bundle = { stamp, generatedFrom: "ilsp-backoffice", data: {} };
let count = 0;
for (const name of FILES) {
  const value = await readJsonSafe(name);
  if (value !== null) { bundle.data[name] = value; count += 1; }
}

// Media manifest (filenames only — the binaries live in git/object storage).
try {
  bundle.mediaFiles = (await readdir(path.join(root, "public", "media"))).filter((f) => !f.startsWith("."));
} catch { bundle.mediaFiles = []; }

await mkdir(outDir, { recursive: true });
const outPath = path.join(outDir, `ilsp-backup-${stamp}.json`);
await writeFile(outPath, JSON.stringify(bundle, null, 2) + "\n", "utf8");
console.log(`Backup written: ${path.relative(root, outPath)} (${count} data files, ${bundle.mediaFiles.length} media).`);
