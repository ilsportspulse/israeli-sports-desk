"use client";

import { useState } from "react";

import { MatchScoreline } from "@/components/match-scoreline";
import type { MatchEvent, MatchRecap } from "@/lib/types";

const tabs = ["Overview", "Stats", "Line-ups", "Timeline"] as const;
type MatchTab = (typeof tabs)[number];

function EventMark({ event }: { event: MatchEvent }) {
  return <span className={`match-event-mark match-event-${event.type}`} aria-hidden="true" />;
}

function EventRow({ event }: { event: MatchEvent }) {
  const labels: Record<string, string> = {
    goal: "Goal",
    "own-goal": "Own goal",
    penalty: "Penalty",
    yellow: "Yellow card",
    "second-yellow": "Second yellow · sent off",
    red: "Red card",
    sub: "Substitution",
    var: "VAR review",
  };
  const label = labels[event.type] ?? "Match event";
  return (
    <li className="match-event-row">
      <time>{event.minute}′</time>
      <EventMark event={event} />
      <div>
        <strong>{event.player}</strong>
        <span>{label} · {event.team}</span>
        {event.detail ? <small>{event.detail}</small> : null}
      </div>
      {event.score ? <b>{event.score}</b> : null}
    </li>
  );
}

export function MatchCentre({ recap }: { recap: MatchRecap }) {
  const [activeTab, setActiveTab] = useState<MatchTab>("Overview");
  const goals = recap.events.filter((event) => event.type === "goal");
  const cards = recap.events.filter((event) => event.type === "yellow" || event.type === "second-yellow");

  return (
    <section className="match-centre" aria-labelledby="match-centre-title">
      <div className="match-centre-heading">
        <div>
          <span className="eyebrow">Match centre</span>
          <h2 id="match-centre-title">Full-time report</h2>
        </div>
        <span>{recap.competition}</span>
      </div>

      <MatchScoreline recap={recap} variant="centre" />

      <div className="match-centre-tabs" role="tablist" aria-label="Match details">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={activeTab === tab}
            className={activeTab === tab ? "active" : ""}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="match-centre-panel" role="tabpanel">
        {activeTab === "Overview" ? (
          <div className="match-overview-grid">
            <dl className="match-facts-grid">
              <div><dt>Stadium</dt><dd>{recap.venue}</dd><small>{recap.city}</small></div>
              <div><dt>Attendance</dt><dd>{recap.attendance?.toLocaleString("en-GB") ?? recap.attendanceNote ?? "Not published"}</dd><small>{recap.attendance ? "spectators" : "crowd figure"}</small></div>
              <div><dt>Kick-off</dt><dd>{new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Jerusalem", hour: "2-digit", minute: "2-digit" }).format(new Date(recap.kickoff))}</dd><small>Jerusalem time</small></div>
              <div><dt>Referee</dt><dd>{recap.referee ?? "Not published"}</dd><small>match official</small></div>
              {recap.shootout ? (
                <div><dt>Penalty shootout</dt><dd>{recap.shootout.home}–{recap.shootout.away}</dd><small>{recap.shootout.note ?? "decided the tie"}</small></div>
              ) : null}
            </dl>
            <div className="match-overview-list">
              <h3>Goals</h3>
              <ul>{goals.map((event) => <EventRow key={`${event.minute}-${event.player}`} event={event} />)}</ul>
            </div>
            <div className="match-overview-list">
              <h3>Discipline</h3>
              <ul>{cards.map((event) => <EventRow key={`${event.minute}-${event.player}-${event.type}`} event={event} />)}</ul>
            </div>
          </div>
        ) : null}

        {activeTab === "Stats" ? (
          recap.statistics?.length ? (
            <div className="match-stats">
              {recap.statistics.map((row) => {
                const homeNum = Number.parseFloat(String(row.home));
                const awayNum = Number.parseFloat(String(row.away));
                const total = (Number.isFinite(homeNum) ? homeNum : 0) + (Number.isFinite(awayNum) ? awayNum : 0);
                const homeShare = total > 0 ? Math.round(((Number.isFinite(homeNum) ? homeNum : 0) / total) * 100) : 50;
                return (
                  <div key={row.label} className="match-stat-row">
                    <div className="match-stat-values"><b>{row.home}</b><span>{row.label}</span><b>{row.away}</b></div>
                    <div className="match-stat-bar" aria-hidden="true">
                      <i style={{ width: `${homeShare}%` }} />
                      <i style={{ width: `${100 - homeShare}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="match-stats-empty">Full team statistics were not published for this fixture.</p>
          )
        ) : null}

        {activeTab === "Line-ups" ? (
          <div className="match-lineups">
            {[recap.home, recap.away].map((team) => (
              <section key={team.name}>
                <div><h3>{team.name}</h3>{team.coach ? <span>Coach: {team.coach}</span> : null}</div>
                <ol>{team.lineup.map((player, index) => <li key={player}><span>{index + 1}</span><strong>{player}</strong></li>)}</ol>
              </section>
            ))}
          </div>
        ) : null}

        {activeTab === "Timeline" ? (
          <ol className="match-timeline">{[...recap.events].reverse().map((event) => <EventRow key={`${event.minute}-${event.player}-${event.type}`} event={event} />)}</ol>
        ) : null}
      </div>
    </section>
  );
}
