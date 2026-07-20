import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const children = [
  spawn(process.execPath, [path.join(root, "node_modules/next/dist/bin/next"), "dev", "--hostname", "0.0.0.0"], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  }),
];

// The Codex newsroom automation owns the 30-minute cycle in normal local use.
// Opt in explicitly when a standalone scheduler is required; this prevents
// repeated `npm run dev` sessions from leaving duplicate ingestion workers.
if (process.env.ILSP_LOCAL_SCHEDULER === "1" || process.env.IL_PLAYBOOK_LOCAL_SCHEDULER === "1") {
  children.push(spawn(process.execPath, [path.join(root, "scripts/scheduler.mjs")], {
    cwd: root,
    env: process.env,
    stdio: "inherit",
  }));
}

let closing = false;
function close(signal = "SIGTERM") {
  if (closing) return;
  closing = true;
  for (const child of children) child.kill(signal);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => close(signal));
}

for (const child of children) {
  child.on("exit", (code) => {
    if (!closing && code) {
      close();
      process.exitCode = code;
    }
  });
}
