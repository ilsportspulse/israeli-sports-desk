import { TeamCrest } from "@/components/team-crest";
import { getBasketballWinnerStyle } from "@/lib/match-style";
import type { BasketballRecap } from "@/lib/types";

export function BasketballScoreline({
  recap,
  variant = "article",
}: {
  recap: BasketballRecap;
  variant?: "lead" | "article" | "centre";
}) {
  return (
    <div
      className={`match-scoreline match-scoreline-${variant}`}
      style={getBasketballWinnerStyle(recap)}
      aria-label={`${recap.home.name} ${recap.home.score}, ${recap.away.name} ${recap.away.score}, full time`}
    >
      <span className="match-score-status">{recap.status}</span>
      <div className="match-score-team match-score-home">
        {recap.home.logo ? <TeamCrest name={recap.home.name} logo={recap.home.logo} /> : <span className="basketball-flag" role="img" aria-label={`${recap.home.name} flag`}>{recap.home.flag}</span>}
        <strong>{variant === "lead" ? recap.home.shortName : recap.home.name}</strong>
      </div>
      <div className="match-score-numbers">
        <b>{recap.home.score}</b><i>–</i><b>{recap.away.score}</b>
      </div>
      <div className="match-score-team match-score-away">
        <strong>{variant === "lead" ? recap.away.shortName : recap.away.name}</strong>
        {recap.away.logo ? <TeamCrest name={recap.away.name} logo={recap.away.logo} alternate /> : <span className="basketball-flag" role="img" aria-label={`${recap.away.name} flag`}>{recap.away.flag}</span>}
      </div>
    </div>
  );
}
