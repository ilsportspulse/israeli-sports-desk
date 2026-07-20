// Branded crest fallback for Israeli clubs — club colours + a short monogram.
// This is NOT the official (trademarked) club logo: when the licensed data feed
// supplies a real crest image we use that; otherwise we render a recognisable,
// on-brand monogram in the club's colours so every Israeli club still looks
// distinct and professional. No copyrighted artwork is reproduced.

export type ClubCrest = { label: string; bg: string; fg: string };

// Keyed by a normalised name fragment. The longest matching key wins, so
// "maccabi tel aviv" beats a generic "maccabi".
const CLUBS: Record<string, ClubCrest> = {
  // --- Football: Ligat ha'Al & cup regulars ---
  "maccabi tel aviv": { label: "MTA", bg: "#00529f", fg: "#ffe000" },
  "maccabi haifa": { label: "MH", bg: "#0a7a3b", fg: "#ffffff" },
  "hapoel beer sheva": { label: "BS", bg: "#d81f26", fg: "#ffffff" },
  "hapoel be'er sheva": { label: "BS", bg: "#d81f26", fg: "#ffffff" },
  "beitar jerusalem": { label: "BJ", bg: "#111111", fg: "#f6d000" },
  "hapoel tel aviv": { label: "HTA", bg: "#c8102e", fg: "#ffffff" },
  "maccabi netanya": { label: "MN", bg: "#f5c400", fg: "#111111" },
  "bnei sakhnin": { label: "SAK", bg: "#d81f26", fg: "#ffffff" },
  "hapoel haifa": { label: "HH", bg: "#e2231a", fg: "#ffffff" },
  "maccabi petah tikva": { label: "MPT", bg: "#0060a9", fg: "#ffffff" },
  "hapoel petah tikva": { label: "HPT", bg: "#0a7a3b", fg: "#ffffff" },
  "hapoel jerusalem": { label: "HJ", bg: "#c8102e", fg: "#111111" },
  "hapoel ramat gan": { label: "RG", bg: "#c8102e", fg: "#ffffff" },
  "maccabi bnei reineh": { label: "MBR", bg: "#0a7a3b", fg: "#ffffff" },
  "ironi kiryat shmona": { label: "KS", bg: "#c8102e", fg: "#0060a9" },
  "hapoel hadera": { label: "HAD", bg: "#111111", fg: "#f5c400" },
  "ashdod": { label: "ASH", bg: "#f5c400", fg: "#c8102e" },
  "maccabi ashdod": { label: "MAS", bg: "#f5c400", fg: "#111111" },
  "sektzia nes tziona": { label: "NES", bg: "#0060a9", fg: "#ffffff" },
  "hapoel afula": { label: "AFU", bg: "#0a7a3b", fg: "#ffffff" },
  // --- Basketball: Winner League ---
  "maccabi rishon": { label: "MRL", bg: "#c8102e", fg: "#ffffff" },
  "hapoel holon": { label: "HOL", bg: "#5b2a86", fg: "#ffffff" },
  "hapoel jerusalem bc": { label: "HJB", bg: "#c8102e", fg: "#111111" },
  "maccabi ashdod bc": { label: "ASH", bg: "#f5c400", fg: "#111111" },
  "ironi nahariya": { label: "NAH", bg: "#0060a9", fg: "#ffffff" },
  "hapoel galil elyon": { label: "GAL", bg: "#0a7a3b", fg: "#ffffff" },
  "bnei herzliya": { label: "HRZ", bg: "#111111", fg: "#ffffff" },
};

function normalise(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(fc|sc|bc|f\.c\.|club)\b/g, "")
    .replace(/[^a-z' ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Monogram from a club name when it isn't in the curated map. */
function initials(name: string): string {
  const words = name.split(/\s+/).filter((w) => !/^(fc|sc|bc)$/i.test(w));
  return words.slice(0, 3).map((w) => w[0]).join("").toUpperCase().slice(0, 3) || "•";
}

export function getClubCrest(name: string): ClubCrest {
  const n = normalise(name);
  let best: ClubCrest | null = null;
  let bestLen = 0;
  for (const [key, crest] of Object.entries(CLUBS)) {
    if ((n === key || n.includes(key)) && key.length > bestLen) {
      best = crest;
      bestLen = key.length;
    }
  }
  if (best) return best;
  // Neutral navy monogram for anyone not in the map (incl. non-Israeli clubs).
  return { label: initials(name), bg: "#0d2447", fg: "#ffffff" };
}
