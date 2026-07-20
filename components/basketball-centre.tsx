"use client";

import { useState } from "react";

import { BasketballScoreline } from "@/components/basketball-scoreline";
import { TeamCrest } from "@/components/team-crest";
import type { BasketballRecap } from "@/lib/types";

const tabs = ["Overview", "Quarter scores", "Team stats"] as const;
type BasketballTab = (typeof tabs)[number];

export function BasketballCentre({ recap }: { recap: BasketballRecap }) {
  const [activeTab, setActiveTab] = useState<BasketballTab>("Overview");

  return (
    <section className="match-centre basketball-centre" aria-labelledby="basketball-centre-title">
      <div className="match-centre-heading">
        <div>
          <span className="eyebrow">Game centre</span>
          <h2 id="basketball-centre-title">Full-time box score</h2>
        </div>
        <span>{recap.competition}</span>
      </div>

      <BasketballScoreline recap={recap} variant="centre" />

      <div className="match-centre-tabs" role="tablist" aria-label="Game details">
        {tabs.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} className={activeTab === tab ? "active" : ""} onClick={() => setActiveTab(tab)}>
            {tab}
          </button>
        ))}
      </div>

      <div className="match-centre-panel" role="tabpanel">
        {activeTab === "Overview" ? (
          <div className="basketball-overview">
            <dl className="match-facts-grid">
              <div><dt>Arena</dt><dd>{recap.venue}</dd><small>{recap.city}</small></div>
              <div><dt>Attendance</dt><dd>{recap.attendance?.toLocaleString("en-GB") ?? recap.attendanceNote ?? "Not published"}</dd><small>{recap.attendance ? "spectators" : "crowd figure"}</small></div>
              <div><dt>Tip-off</dt><dd>{new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" }).format(new Date(recap.tipoff))}</dd><small>Jerusalem time</small></div>
              <div><dt>Officials</dt><dd>{recap.officials.length}</dd><small>{recap.officials.join(" · ")}</small></div>
            </dl>
            <div className="basketball-leaders">
              <h3>Game leaders</h3>
              {recap.leaders.map((leader) => (
                <div key={`${leader.player}-${leader.label}`}><span>{leader.label}</span><strong>{leader.player}</strong><small>{leader.team}</small><b>{leader.value}</b></div>
              ))}
            </div>
          </div>
        ) : null}

        {activeTab === "Quarter scores" ? (
          <div className="quarter-table" role="table" aria-label="Quarter-by-quarter score">
            <div className="quarter-row quarter-head" role="row"><span>Team</span>{recap.home.quarters.map((_, index) => <span key={index}>Q{index + 1}</span>)}<strong>Total</strong></div>
            {[recap.home, recap.away].map((team) => (
              <div className="quarter-row" role="row" key={team.name}><span>{team.logo ? <TeamCrest name={team.name} logo={team.logo} /> : team.flag} {team.name}</span>{team.quarters.map((score, index) => <span key={index}>{score}</span>)}<strong>{team.score}</strong></div>
            ))}
          </div>
        ) : null}

        {activeTab === "Team stats" ? (
          <div className="basketball-stats">
            <div className="basketball-stat-head"><strong>{recap.home.shortName}</strong><span>Team comparison</span><strong>{recap.away.shortName}</strong></div>
            {recap.stats.map((stat) => <div key={stat.label}><b>{stat.home}</b><span>{stat.label}</span><b>{stat.away}</b></div>)}
          </div>
        ) : null}
      </div>
    </section>
  );
}
