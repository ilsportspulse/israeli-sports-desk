export function competitionPriority(sport: string, league: string): number {
  const s = sport.toLowerCase();
  const l = league.toLowerCase();
  if (s.includes("foot") || s.includes("soccer")) {
    if (l.includes("israeli premier") || l.includes("ligat")) return 1;
    if (l.includes("super cup")) return 2;
    if (l.includes("toto")) return 3;
    if (l.includes("state cup")) return 4;
    if (l.includes("leumit")) return 5;
    if (l.includes("champions league")) return 6;
    if (l.includes("europa")) return 7;
    if (l.includes("conference")) return 8;
    if (l.includes("world cup")) return 9;
    return 30;
  }
  if (s.includes("basket")) {
    if (l.includes("israeli basketball premier") || l.includes("winner")) return 10;
    if (l.includes("state cup")) return 11;
    if (l.includes("national league")) return 12;
    if (l.includes("euroleague")) return 13;
    if (l.includes("u20") || l.includes("eurobasket")) return 14;
    if (l.includes("summer league") || l.includes("nba")) return 15;
    return 35;
  }
  if (s.includes("hand")) {
    if (l.includes("ehf") || l.includes("euro")) return 20;
    return 40;
  }
  return 60;
}
