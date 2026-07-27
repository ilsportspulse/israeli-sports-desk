import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// Persistence layer for all backoffice data (articles, redirects, settings, …).
// Single source of truth = the git repo (the content IS the backup + audit trail).
//
//   • Local dev: writes go straight to the working-tree file.
//   • Production (Vercel): the serverless filesystem is read-only/ephemeral, so a
//     write instead COMMITS the file to GitHub via the Contents API, which triggers
//     a Vercel redeploy that serves the new content. Reads always come from the
//     files shipped with the current deployment.
//
// If GITHUB_TOKEN isn't configured we fall back to a disk write everywhere, so the
// backoffice still works in any self-hosted / long-lived-filesystem environment.

const root = process.cwd();

function commitEnabled(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

// On Vercel the FS is read-only, so prefer committing there.
function preferCommit(): boolean {
  return commitEnabled() && Boolean(process.env.VERCEL);
}

export async function readData<T>(rel: string, fallback: T): Promise<T> {
  try {
    const raw = await readFile(path.join(root, rel), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export type WriteOpts = { actor?: string; message?: string };

export async function writeData(rel: string, value: unknown, opts: WriteOpts = {}): Promise<void> {
  const content = typeof value === "string" ? value : JSON.stringify(value, null, 2) + "\n";

  // Best-effort local write (authoritative in dev; harmless no-op if RO in prod).
  try {
    await writeFile(path.join(root, rel), content, "utf8");
  } catch (err) {
    if (!preferCommit()) throw err;
  }

  if (preferCommit()) {
    const who = opts.actor ? ` by ${opts.actor}` : "";
    await commitToGitHub(rel, content, opts.message ?? `chore(backoffice): update ${rel}${who}`);
  }
}

// Binary variant of writeData for uploaded assets (images). Same strategy:
// disk in dev, GitHub commit on Vercel so the file ships with the next deploy.
export async function writeBinaryData(rel: string, data: Buffer, opts: WriteOpts = {}): Promise<void> {
  try {
    await mkdir(path.dirname(path.join(root, rel)), { recursive: true });
    await writeFile(path.join(root, rel), data);
  } catch (err) {
    if (!preferCommit()) throw err;
  }

  if (preferCommit()) {
    const who = opts.actor ? ` by ${opts.actor}` : "";
    await commitBase64ToGitHub(rel, data.toString("base64"), opts.message ?? `chore(backoffice): upload ${rel}${who}`);
  }
}

async function commitToGitHub(rel: string, content: string, message: string): Promise<void> {
  await commitBase64ToGitHub(rel, Buffer.from(content, "utf8").toString("base64"), message);
}

async function commitBase64ToGitHub(rel: string, base64: string, message: string): Promise<void> {
  const repo = process.env.GITHUB_REPO; // "owner/name"
  const token = process.env.GITHUB_TOKEN;
  const branch = process.env.GITHUB_BRANCH || "main";
  const api = `https://api.github.com/repos/${repo}/contents/${encodeURI(rel)}`;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "ilsp-backoffice",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Commit with retry: while a newsroom cycle is pushing, the blob sha or
  // branch head can move between our read and write, which GitHub rejects
  // (409/422). Refetching the sha and retrying with backoff makes backoffice
  // saves reliable instead of surfacing "GitHub commit failed" to the editor.
  let lastError = "";
  for (let attempt = 0; attempt < 4; attempt += 1) {
    let sha: string | undefined;
    const current = await fetch(`${api}?ref=${branch}`, { headers, cache: "no-store" });
    if (current.ok) {
      const json = (await current.json()) as { sha?: string };
      sha = json.sha;
    }

    const body = {
      message,
      content: base64,
      branch,
      sha,
      // Commit author must map to a GitHub account or Vercel blocks the deploy.
      committer: { name: "fmgaming-core", email: "230560160+fmgaming-core@users.noreply.github.com" },
      author: { name: "fmgaming-core", email: "230560160+fmgaming-core@users.noreply.github.com" },
    };

    const res = await fetch(api, { method: "PUT", headers, body: JSON.stringify(body) });
    if (res.ok) return;
    lastError = `${res.status} ${await res.text()}`;
    if (res.status !== 409 && res.status !== 422) break;
    await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
  }
  throw new Error(`GitHub commit failed for ${rel}: ${lastError}`);
}
