import type { Metadata } from "next";
import Link from "next/link";

import { BrandLockup } from "@/components/brand";
import { ArrowIcon, HomeIcon } from "@/components/icons";

export const metadata: Metadata = {
  title: "Why ILSP exists",
  description: "The personal story behind Israel Sports Pulse and its mission to build a trusted English home for Israeli sport.",
};

const moments = [
  {
    year: "1973",
    title: "Born between two homes",
    copy: "ILSP’s founder was born in Tel Aviv to an Israeli mother and a Belgian father. Israel was never an abstract subject; it was family, identity and home.",
  },
  {
    year: "1982",
    title: "Belgium changed the distance, not the connection",
    copy: "After moving to Belgium, the bond with Israel remained strong through its culture, food, directness and, above all, its sport.",
  },
  {
    year: "2000s",
    title: "Israeli players made the gap impossible to ignore",
    copy: "The arrivals of Elyaniv Barda, Barak Itzhaki, Lior Refaelov and other Israeli players in Belgian football created interest without creating enough reliable context for supporters who did not read Hebrew.",
  },
  {
    year: "Today",
    title: "A long-held idea becomes a daily commitment",
    copy: "The idea of one English platform for news, scores, detail and interaction first formed more than a decade ago. ILSP is the decision to finally build it properly.",
  },
];

export default function AboutPage() {
  return (
    <div className="about-page">
      <header className="article-header about-header">
        <div className="page-width article-nav">
          <Link href="/" className="brand-lockup" aria-label="Israel Sports Pulse home">
            <BrandLockup />
          </Link>
          <Link href="/stories" className="about-header-link">All stories</Link>
          <Link href="/" className="article-back"><HomeIcon size={16} /> Back to the desk</Link>
        </div>
      </header>

      <main>
        <section className="about-hero">
          <div className="page-width about-hero-grid">
            <div>
              <span className="eyebrow inverse">Why ILSP exists</span>
              <h1>A missing connection became a life’s project.</h1>
            </div>
            <p>
              Israel Sports Pulse is being built for people who care about Israeli sport but cannot always reach its stories in Hebrew — Israelis abroad, Jewish communities and every supporter drawn to the clubs, athletes and sporting culture of Israel.
            </p>
          </div>
        </section>

        <section className="page-width about-story" aria-labelledby="founder-story-heading">
          <div className="about-story-intro">
            <span className="eyebrow">The founder story</span>
            <h2 id="founder-story-heading">The need was personal long before it became a product.</h2>
            <p>
              Following Israeli sport from Belgium repeatedly exposed the same problem: results travelled, but the names, context, atmosphere and small details often did not. English-speaking supporters could see that something had happened without being brought properly inside the story.
            </p>
          </div>
          <ol className="about-timeline">
            {moments.map((moment) => (
              <li key={moment.year}>
                <span>{moment.year}</span>
                <h3>{moment.title}</h3>
                <p>{moment.copy}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-community">
          <div className="page-width about-community-grid">
            <div>
              <span className="eyebrow inverse">More than a news feed</span>
              <h2>Sport can give a dispersed audience one shared place.</h2>
            </div>
            <div>
              <p>
                ILSP’s ambition is to bring people together around the full Israeli sporting system: football and basketball, Olympic and Paralympic sport, women and youth, lower divisions, history and Israelis competing abroad.
              </p>
              <p>
                The audience is deliberately open. Israeli or not, Jewish or not, anyone who wants serious, welcoming and detailed English coverage should be able to understand the competition and join the conversation.
              </p>
            </div>
          </div>
        </section>

        <section className="page-width about-funding">
          <div>
            <span className="eyebrow">Why funding matters</span>
            <h2>Passion starts the work. A professional team sustains it.</h2>
          </div>
          <div className="about-funding-copy">
            <p>
              ILSP is founder-driven, but dependable daily journalism cannot rest on spare time alone. Funding pays for editors and reporters, licensed data, exact rights-cleared imagery, technology, audience products and the people who turn a personal commitment into a durable newsroom.
            </p>
            <p>
              The goal is not volume for its own sake. It is a financially sustainable English sports publication that can report quickly, add context, correct openly and protect its editorial decisions from commercial influence.
            </p>
            <Link href="/commercial-independence">Read our commercial-independence standard <ArrowIcon size={17} /></Link>
          </div>
        </section>
      </main>
    </div>
  );
}
