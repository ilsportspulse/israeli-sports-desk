import { TeamCrest } from "@/components/team-crest";
import { getWinnerStyle } from "@/lib/match-style";
import type { MatchRecap } from "@/lib/types";

export function MatchScoreline({
  recap,
  variant = "article",
}: {
  recap: MatchRecap;
  variant?: "lead" | "article" | "centre";
}) {
  return (
    <div className={`match-scoreline match-scoreline-${variant}`} style={getWinnerStyle(recap)} aria-label={`${recap.home.name} ${recap.home.score}, ${recap.away.name} ${recap.away.score}, full time`}>
      <span className="match-score-status">{recap.shootout ? `${recap.status} · ${recap.shootout.home}\u2013${recap.shootout.away} pens` : recap.status}</span>
      <div className="match-score-team match-score-home">
        <TeamCrest name={recap.home.name} logo={recap.home.logo} />
        <strong>{variant === "centre" ? recap.home.name : recap.home.shortName}</strong>
      </div>
      <div className="match-score-numbers">
        <b>{recap.home.score}</b><i>–</i><b>{recap.away.score}</b>
      </div>
      <div className="match-score-team match-score-away">
        <strong>{variant === "centre" ? recap.away.name : recap.away.shortName}</strong>
        <TeamCrest name={recap.away.name} logo={recap.away.logo} alternate />
      </div>
    </div>
  );
}
