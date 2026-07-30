// Race-proof publiceren vanuit de CI-cyclus zélf. Draait als staart van `npm
// test` (quality gate) maar doet buiten GitHub Actions niets. Commit alle
// cyclusoutput, rebased op de actuele main en pusht met retries — mét
// automatische resolutie voor de bekende data-JSON's wanneer een gequeuede run
// van een oude checkout vertrok (dé bron van de "Run failed"-mails). De
// workflow-pushstap erna ziet daarna een schone tree en kan niet meer falen.
import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";

if (process.env.GITHUB_ACTIONS !== "true") process.exit(0);

// 256 MB buffer: data/article-media.json is groter dan de standaard 1 MB, dus
// `git show :N:data/article-media.json` gaf ENOBUFS → cyclus-crash → faalmails.
const BUF = { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 };
const git = (...args) => execFileSync("git", args, BUF);
const tryGit = (...args) => spawnSync("git", args, BUF);

if (!git("status", "--porcelain").trim()) { console.log("[self-push] Geen nieuwe content."); process.exit(0); }

git("config", "user.name", "fmgaming-core");
git("config", "user.email", "230560160+fmgaming-core@users.noreply.github.com");
git("add", "-A");
git("commit", "-m", `Autonomous newsroom cycle: ${new Date().toISOString().slice(0, 16)}Z`);

// Bekende cyclus-JSON's: bij een rebaseconflict mechanisch samenvoegen.
// articles: array-unie op id (onze run wint voor ids die wij aanraakten);
// object-maps: unie met onze waarden bovenop.
const unionResolve = (file) => {
  const ours = JSON.parse(git("show", `:3:${file}`));
  let theirs = null;
  try { theirs = JSON.parse(git("show", `:2:${file}`)); } catch { /* upstream had het bestand niet */ }
  let merged = ours;
  if (Array.isArray(ours) && Array.isArray(theirs)) {
    const byId = new Map(theirs.map((x) => [x.id ?? JSON.stringify(x), x]));
    for (const x of ours) byId.set(x.id ?? JSON.stringify(x), x);
    merged = [...byId.values()];
  } else if (ours && theirs && typeof ours === "object" && !Array.isArray(ours)) {
    merged = { ...theirs, ...ours };
  }
  writeFileSync(file, `${JSON.stringify(merged, null, 2)}\n`);
  git("add", "--", file);
};

for (let attempt = 1; attempt <= 4; attempt++) {
  git("fetch", "origin", "main");
  const rebase = tryGit("rebase", "origin/main");
  if (rebase.status !== 0) {
    const conflicted = git("diff", "--name-only", "--diff-filter=U").trim().split("\n").filter(Boolean);
    const unknown = conflicted.filter((f) => !/^data\/[\w.-]+\.json$/.test(f));
    if (unknown.length) {
      console.error(`[self-push] Onbekend conflict in: ${unknown.join(", ")} — afbreken.`);
      tryGit("rebase", "--abort");
      process.exit(1);
    }
    for (const f of conflicted) unionResolve(f);
    const cont = spawnSync("git", ["rebase", "--continue"], { encoding: "utf8", env: { ...process.env, GIT_EDITOR: "true" } });
    if (cont.status !== 0) { console.error("[self-push] Rebase-continue faalde — afbreken."); tryGit("rebase", "--abort"); process.exit(1); }
    console.log(`[self-push] Conflict opgelost via unie-merge: ${conflicted.join(", ")}`);
  }
  const push = tryGit("push", "origin", "HEAD:main");
  if (push.status === 0) { console.log(`[self-push] Gepusht (poging ${attempt}).`); process.exit(0); }
  console.log(`[self-push] Push geweigerd (poging ${attempt}) — opnieuw rebasen…`);
}
console.error("[self-push] Push bleef falen na 4 pogingen.");
process.exit(1);
