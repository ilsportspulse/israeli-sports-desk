// Canonical event identity helpers, shared by the publish gate (newsroom-run)
// and the recurring backlog sweep (cleanup-backlog).
//
// Two drafts about one event routinely arrive with dedupeKeys that differ only
// in incidental detail — "…-ginat-contract-extension-2030" vs "…-extension-2026"
// (one model keyed the contract's end year, the other the announcement year).
// Canonicalisation strips numbers/years and word order so those collide.

export function canonicalEventKey(key) {
  const lower = (key ?? "").toLowerCase();
  const exact = lower.split(/[^a-z0-9]+/).filter(Boolean).join("-");
  // Only PERSON-ACTION events (contract, transfer, appointment, …) get their
  // numbers stripped and tokens sorted: for those, digits are incidental (a
  // contract's end year vs the announcement year). MATCH-style keys keep their
  // digits — the date is what separates leg one from leg two and stage 18 from
  // stage 19, and folding those would merge genuinely different fixtures.
  if (!actionClassOf(lower)) return exact;
  return lower
    .split(/[^a-z0-9]+/)
    .filter((t) => t && !/^\d+$/.test(t))
    .sort()
    .join("-");
}

// Action classes for the person+action duplicate rule: two stories in the same
// few days that name the same person AND describe the same class of event are
// the same story told twice, whatever the phrasing.
const ACTION_CLASSES = [
  ["contract", /\b(contracts?|extends?|extension|renew\w*|new deal|signs?|signed|signing|re-signs?)\b/i],
  ["transfer", /\b(transfers?|joins?|joined|moves?|moved|loan\w*|arriv\w+|unveil\w*)\b/i],
  ["injury", /\b(injur\w+|surgery|sidelined|ruled out|out for)\b/i],
  ["exit", /\b(leav\w+|exits?|departs?|released|sacked|fired|resigns?|retir\w+)\b/i],
  ["appointment", /\b(named|appointed|takes over|new (?:coach|manager|boss))\b/i],
  // One fight/match outcome told twice ("flattens" vs "knocks out", 28 Jul
  // Kibedy Gordon dup). Same person + this class + shared context (opponent,
  // event) within days = one story; different opponents share no context, so
  // routine weekly results never collide.
  ["result-win", /\b(knock(?:s|ed)?(?:[ -]?out)?|ko\b|flatten\w*|stoppage|submission|tko|beats?|defeats?|edges|outpoints?|wins? (?:by|over|against))\b/i],
];

export function actionClassOf(text) {
  for (const [name, re] of ACTION_CLASSES) if (re.test(text)) return name;
  return null;
}

// Club/city/competition words that must never count as a "person" token — many
// Israeli club names share them, so they identify a scene, not a subject.
const NON_PERSON = new Set((
  "hapoel maccabi beitar bnei ironi tel aviv haifa jerusalem sheva beer netanya " +
  "sakhnin herzliya eilat tikva petah shmona kiryat hadera ramat gan ashdod afula " +
  "israel israeli euroleague eurocup uefa fifa nba league premier ligat winner " +
  "united city real madrid barcelona liverpool chelsea arsenal bayern the this that " +
  "after before says said with from into over"
).split(/\s+/));

// Distinctive lowercase tokens of a story (title+dek) for context comparison —
// generic news vocabulary removed so overlap means shared subject, not shared genre.
const GENERIC = new Set(("the and for with from after before over into out its his her their they them league cup europa conference champions nations world european stage tour season report reports move deal signing preview clash opener rout win draw loss goal goals side club team first second third final semifinal against north south east west united city real inter athletic sporting star young boys football cycling basketball soccer news article year years have has had made make makes making back last summer winter next new sign signs signed return returns returning coach coaches fans supporters told tells said says agree agrees agreed talks talk contract test ready fit fitness training start starts started week weekend saturday sunday monday tuesday wednesday thursday friday ahead face faces facing eye eyes eyeing open opens opening close closing set aims aim push night tonight home away player players manager boss target targets reportedly surprise interest links link loan window campaign tie leg round group match game games play plays date confirmed confirm reveals reveal debut this that will would could been being more most about their which when what where").split(/\s+/));

export function contextTokensOf(article) {
  return new Set(
    `${article.title ?? ""} ${article.dek ?? ""}`
      .split(/[^A-Za-zÀ-ÖØ-öø-ÿ'’]+/)
      .map((w) => w.replace(/[’']s?$/i, "").toLowerCase())
      .filter((w) => w.length >= 4 && !GENERIC.has(w)),
  );
}

// Capitalised tokens from the original (cased) title that plausibly name a person.
export function personTokensOf(title) {
  return new Set(
    (title ?? "")
      .split(/[^A-Za-zÀ-ÖØ-öø-ÿ'’]+/)
      .filter((w) => /^[A-ZÀ-Ö]/.test(w) && w.length >= 4)
      .map((w) => w.replace(/[’']s?$/i, "").toLowerCase())
      .filter((w) => !NON_PERSON.has(w)),
  );
}
