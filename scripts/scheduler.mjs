import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const configuredMinutes = Number(process.env.NEWSROOM_INTERVAL_MINUTES ?? 30);
const intervalMinutes = Number.isFinite(configuredMinutes) ? Math.max(5, configuredMinutes) : 30;
const intervalMs = intervalMinutes * 60 * 1000;
let running = false;

function ingest() {
  if (running) return;
  running = true;
  const child = spawn(process.execPath, [path.join(root, "scripts/ingest.mjs")], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  });
  child.once("exit", () => { running = false; });
  child.once("error", () => { running = false; });
}

ingest();
setInterval(ingest, intervalMs).unref();
process.stdin.resume();
