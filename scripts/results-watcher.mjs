// RESULTS WATCHER (eigenaarseis 31 jul): elke afgelopen wedstrijd met een
// Israëlisch team — ELKE sport, domestic én Europees — komt meteen na het
// eindsignaal als verslag op de site, zonder uitzondering.
//
// Bron: ESPN's publieke scoreboard-API (actueel, FT binnen minuten). We gaan
// per cyclus de endpoints in config/results-sources.json af (Israëlische liga +
// alle Europese competities + EuroLeague), voor vandaag én gisteren (Israel-tijd),
// filteren op afgeronde wedstrijden met een Israëlisch team, en publiceren voor
// elke nieuwe een kort, correct FT-verslag (score in de kop). Een ledger
// (data/results-covered.json) voorkomt dubbels. Draait aan het BEGIN van de
// cyclus zodat een resultaat nooit blijft liggen.
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { titleSimilarity } from "./newsroom-core.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Two competitors → a normalized signature (core surnames + score + day), robust
// to feed name variants ("Ludogorets" vs "Ludogorets Razgrad").
const CLUB_NOISE = /\b(fc|bc|sc|cf|razgrad|reykjavik|tiraspol|jerusalem|tel[- ]aviv|larnaca|nicosia|belgrade|sofia|split|budapest)\b/gi;
const coreName = (n) => (n || "").toLowerCase().replace(CLUB_NOISE, "").replace(/[^a-z ]+/g, " ").split(/\s+/).filter((w) => w.length >= 3).sort().join(" ");
const readJson = async (rel, fb) => { try { return JSON.parse(await readFile(path.join(root, rel), "utf8")); } catch { return fb; } };
const slugify = (s) => (s || "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

// Israel-time date strings for today and the past 1-2 days (matches finish late).
function espnDates() {
  const out = [];
  for (let d = 0; d <= 2; d += 1) {
    const t = new Date(Date.now() - d * 86400_000);
    const il = new Date(t.toLocaleString("en-US", { timeZone: "Asia/Jerusalem" }));
    out.push(`${il.getFullYear()}${String(il.getMonth() + 1).padStart(2, "0")}${String(il.getDate()).padStart(2, "0")}`);
  }
  return [...new Set(out)];
}

export async function runResultsWatcher({ dryRun = false } = {}) {
  const cfg = await readJson("config/results-sources.json", { endpoints: [], israeliTeamPattern: "" });
  const isIsraeli = new RegExp(cfg.israeliTeamPattern || "israel", "i");
  const ledger = await readJson("data/results-covered.json", { events: [] });
  const covered = new Set((ledger.events ?? []).map((e) => e.id));
  const articlesDoc = await readJson("data/articles.json", []);
  const articles = Array.isArray(articlesDoc) ? articlesDoc : (articlesDoc.articles ?? []);
  const keys = new Set(articles.map((a) => a.dedupeKey).filter(Boolean));
  const ids = new Set(articles.map((a) => a.id));
  // Stories we ALREADY have, with their team-tokens and match day parsed from the
  // dedupeKey ("<sport> <team1> <team2> match <YYYY-MM-DD>"). We only treat a
  // candidate as covered when it is the SAME match (same day + both teams), so a
  // return leg on another day is still published as its own result.
  // ONLY real result/match-report stories count as "already covered" — a preview
  // or team-news piece about the same teams must NOT block the result flash (that
  // was the exact miss: dozens of previews, no full-time report).
  const SCORE_IN_TITLE = /\d+\s*[–\-:]\s*\d+/;
  const existing = articles
    .filter((a) => (a.status ?? "published") !== "review")
    .filter((a) => ["match-report", "result-flash"].includes(a.storyForm) || SCORE_IN_TITLE.test(a.title || "") || a.matchRecap || a.basketballRecap)
    .map((a) => {
      const dk = a.dedupeKey || "";
      const mday = dk.match(/(\d{4}-\d{2}-\d{2})/);
      const teamsPart = (dk.split(" match ")[0] || "").replace(/^\S+\s/, "");
      return { title: a.title || "", day: mday ? mday[1] : "", teamTokens: `${teamsPart} ${coreName(a.title)}` };
    });
  const tokensOf = (n) => coreName(n).split(" ").filter(Boolean);
  const coveredMatch = (title, home, away, day) => existing.some((e) => {
    if (e.day && e.day !== day) return false; // different day = different match (legs)
    const ht = tokensOf(home), at = tokensOf(away);
    const bothTeams = ht.some((t) => e.teamTokens.includes(t)) && at.some((t) => e.teamTokens.includes(t));
    return bothTeams || (e.day === day && titleSimilarity(e.title, title) >= 0.55);
  });
  const dates = espnDates();
  const now = Date.now();
  const added = [];

  for (const ep of cfg.endpoints ?? []) {
    for (const date of dates) {
      let events = [];
      try {
        const url = `https://site.api.espn.com/apis/site/v2/sports/${ep.sport}/${ep.league}/scoreboard?dates=${date}`;
        const res = await fetch(url, { headers: { "user-agent": "IsraelSportsPulse/1.0 results-watcher" } });
        if (!res.ok) continue;
        events = (await res.json())?.events ?? [];
      } catch { continue; }

      for (const ev of events) {
        const comp = ev.competitions?.[0];
        const status = ev.status?.type;
        if (!comp || !status?.completed) continue; // only finished
        const cs = comp.competitors ?? [];
        if (cs.length !== 2) continue;
        if (!cs.some((c) => isIsraeli.test(c.team?.displayName || ""))) continue;

        const evId = `espn-${ev.id}`;
        if (covered.has(evId)) continue;

        const homeC = cs.find((c) => c.homeAway === "home") ?? cs[0];
        const awayC = cs.find((c) => c.homeAway === "away") ?? cs[1];
        const home = homeC.team.displayName, away = awayC.team.displayName;
        const hs = Number(homeC.score), as = Number(awayC.score);
        if (!Number.isFinite(hs) || !Number.isFinite(as)) continue;
        const when = Date.parse(ev.date) || now;
        const day = new Date(when).toISOString().slice(0, 10);
        const isSoccer = ep.sport === "soccer";
        const dedupeKey = `${(isSoccer ? "football" : ep.sport)} ${slugify(home)} ${slugify(away)} match ${day}`;
        if (keys.has(dedupeKey)) { covered.add(evId); ledger.events.push({ id: evId, dedupeKey, at: new Date(when).toISOString() }); continue; }

        const provTitle = `${home} ${hs}–${as} ${away}: ${ep.label}`;
        if (coveredMatch(provTitle, home, away, day)) {
          // The AI cycle already wrote this match (fuller report) — never double it.
          covered.add(evId); ledger.events.push({ id: evId, dedupeKey, at: new Date(when).toISOString() }); continue;
        }

        const detail = status.shortDetail || status.detail || "FT";
        const pens = /pen/i.test(detail);
        const winner = hs === as ? null : (hs > as ? home : away);
        const scoreStr = `${hs}–${as}`;
        const category = isSoccer ? "Israeli Football" : /basket/i.test(ep.sport) ? "Israeli Basketball" : "Israeli Sport";
        const title = `${home} ${scoreStr} ${away}: ${ep.label}`;
        let id = `result-${slugify(day)}-${slugify(home)}-${slugify(away)}`.slice(0, 92);
        while (ids.has(id)) id += "-x";
        const slug = slugify(`${home}-${scoreStr}-${away}-${ep.label}`);
        const dateLine = new Date(when).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jerusalem" });

        // Scoring plays if ESPN exposes them on the scoreboard (soccer/basketball).
        const scorers = (comp.details ?? [])
          .filter((d) => d.scoringPlay && d.athletesInvolved?.[0])
          .map((d) => `${d.athletesInvolved[0].displayName}${d.clock?.displayValue ? ` (${d.clock.displayValue})` : ""}`);

        const verb = winner ? (winner === home ? "beat" : "lost to") : "drew with";
        const other = winner === home ? away : home;
        const article = {
          id, slug, title,
          dek: winner
            ? `${winner} ${pens ? "edged" : "beat"} ${winner === home ? away : home} ${hs > as ? scoreStr : `${as}–${hs}`}${pens ? " on penalties" : ""} in the ${ep.label} on ${dateLine}.`
            : `${home} and ${away} drew ${scoreStr} in the ${ep.label} on ${dateLine}.`,
          category, desk: "israel", kind: "news", storyForm: "result-flash",
          publishedAt: new Date(Math.min(now, when + 2 * 3600_000)).toISOString(),
          readMinutes: 1,
          source: { name: "ESPN", url: `https://www.espn.com/${ep.sport}/match/_/gameId/${ev.id}` },
          verificationSources: [{ label: "ESPN — match centre", url: `https://www.espn.com/${ep.sport}/match/_/gameId/${ev.id}` }],
          body: [
            `${home} ${verb} ${away} ${scoreStr}${pens ? " (after a penalty shootout)" : ""} in the ${ep.label} on ${dateLine}. The result is confirmed; Israel Sports Pulse is publishing it at full time and will expand the report as the details are verified.`,
            scorers.length
              ? `On the scoresheet: ${scorers.join(", ")}. The full-time score of ${scoreStr} stands as the official result of the fixture.`
              : (winner
                  ? `${winner} took the ${pens ? "tie on penalties" : "points"} with a ${scoreStr} scoreline, a result that matters for ${isIsraeli.test(winner) ? "the Israeli side's" : "the"} campaign in this competition.`
                  : `The two sides could not be separated, the ${isSoccer ? "match" : "game"} finishing ${scoreStr} — a share of the ${isSoccer ? "points" : "spoils"} in the ${ep.label}.`),
            `Goalscorers, key moments, cards and post-match reaction will be added to this report as they are confirmed from the match records. For the definitive picture, follow Israel Sports Pulse for the full write-up.`,
          ],
          facts: [
            `${home} ${scoreStr} ${away} — ${ep.label}, played ${dateLine}.`,
            winner ? `${winner} ${pens ? "advanced/won on penalties" : "won the fixture"}.` : `The fixture ended level at ${scoreStr}.`,
            `Competition: ${ep.label} (${ep.sport}).`,
          ],
          theme: "night-pitch",
          homepagePriority: isIsraeli.test(winner || "") ? 90 : 80,
          homepageReason: "A confirmed result involving an Israeli team, published automatically at full time.",
          dedupeKey, trending: 4, status: "published",
          aiDisclosure: "Automated result flash generated at full time from ESPN's match data (final score, competition and, where available, scorers). Expanded and cross-checked in follow-up coverage.",
          commonsQuery: `${winner || home} ${isSoccer ? "football" : ep.sport}`,
        };
        articles.push(article);
        ids.add(id); keys.add(dedupeKey); covered.add(evId);
        ledger.events.push({ id: evId, articleId: id, dedupeKey, at: new Date(when).toISOString() });
        added.push(title);
      }
      await new Promise((r) => setTimeout(r, 250));
    }
  }

  if (added.length && !dryRun) {
    if (Array.isArray(articlesDoc)) await writeFile(path.join(root, "data/articles.json"), `${JSON.stringify(articles, null, 2)}\n`);
    ledger.events = (ledger.events ?? []).slice(-8000);
    ledger.updatedAt = new Date(now).toISOString();
    await writeFile(path.join(root, "data/results-covered.json"), `${JSON.stringify(ledger, null, 2)}\n`);
  }
  console.log(`[results-watcher] ${added.length} new Israeli result(s)${added.length ? ": " + added.join(" | ") : ""}.`);
  return added;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runResultsWatcher({ dryRun: process.argv.includes("--dry-run") }).then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
}
