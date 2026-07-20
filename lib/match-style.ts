import type { CSSProperties } from "react";

import type { BasketballRecap, BasketballTeam, MatchRecap, MatchTeam } from "@/lib/types";

type WinnerStyle = CSSProperties & {
  "--winner-primary"?: string;
  "--winner-secondary"?: string;
};

export function getWinningTeam(recap: MatchRecap): MatchTeam | null {
  if (recap.home.score === recap.away.score) return null;
  return recap.home.score > recap.away.score ? recap.home : recap.away;
}

export function getWinnerStyle(recap: MatchRecap): WinnerStyle | undefined {
  const winner = getWinningTeam(recap);
  if (!winner?.colors?.primary) return undefined;

  return {
    "--winner-primary": winner.colors.primary,
    "--winner-secondary": winner.colors.secondary ?? winner.colors.primary,
  };
}

export function getBasketballWinningTeam(recap: BasketballRecap): BasketballTeam | null {
  if (recap.home.score === recap.away.score) return null;
  return recap.home.score > recap.away.score ? recap.home : recap.away;
}

export function getBasketballWinnerStyle(recap: BasketballRecap): WinnerStyle | undefined {
  const winner = getBasketballWinningTeam(recap);
  if (!winner?.colors?.primary) return undefined;

  return {
    "--winner-primary": winner.colors.primary,
    "--winner-secondary": winner.colors.secondary ?? winner.colors.primary,
  };
}
