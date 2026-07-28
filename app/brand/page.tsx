import type { Metadata } from "next";
import Image from "next/image";

import styles from "./brand.module.css";

export const metadata: Metadata = {
  alternates: { canonical: "/brand" },
  title: "Brand system — Israel Sports Pulse",
  description: "Internal approved identity for Israel Sports Pulse.",
  robots: { index: false, follow: false },
};

function BrandMark() {
  return (
    <svg
      aria-label="Israel Sports Pulse sponsor-ready mark"
      className={styles.mark}
      role="img"
      viewBox="0 0 96 96"
    >
      <rect fill="#07152f" height="96" rx="24" width="96" />
      <g transform="skewX(-7)">
        <text fill="#ffffff" fontFamily="Arial Black, Arial, sans-serif" fontSize="39" fontWeight="900" letterSpacing="-4.6" x="10" y="59">ILSP</text>
      </g>
      <path
        d="M79 6l2.75 5h5.75l-3 5 3 5h-5.75L79 26l-2.75-5H70.5l3-5-3-5h5.75zM79 12l3.2 2v4L79 20l-3.2-2v-4z"
        fill="#4f7dff"
        fillRule="evenodd"
        transform="rotate(8 79 16)"
      />
      <path d="M14 72h64" stroke="#155eef" strokeLinecap="round" strokeWidth="6" />
    </svg>
  );
}

function Lockup({ inverse = false, compact = false }: { inverse?: boolean; compact?: boolean }) {
  return (
    <div className={`${styles.lockup} ${inverse ? styles.inverse : ""} ${compact ? styles.compact : ""}`}>
      <BrandMark />
      <div>
        <strong><span>ISRAEL</span> <em>SPORTS</em> PULSE</strong>
        {!compact && (
          <small>THE BEAT OF ISRAELI SPORT</small>
        )}
      </div>
    </div>
  );
}

const channels = [
  ["X", "@ILSportsPulse", "Breaking news, live context, links"],
  ["Instagram", "@ILSportsPulse", "Action photography, carousels, Reels"],
  ["TikTok", "@ILSportsPulse", "Fast explainers, history, fan culture"],
  ["YouTube", "@ILSportsPulse", "Match analysis, interviews, archive films"],
  ["Facebook", "Israel Sports Pulse", "Community, diaspora, longer discussion"],
  ["LinkedIn", "Israel Sports Pulse", "Sponsors, milestones, media credibility"],
  ["WhatsApp", "Israel Sports Pulse — Latest", "High-value alerts, not every article"],
];

export default function BrandPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroTop}>
          <span>Approved brand system 01</span>
          <span>Internal working board · 15 July 2026</span>
        </div>
        <div className={styles.heroGrid}>
          <div>
            <p className={styles.eyebrow}>Approved identity · local implementation</p>
            <Lockup inverse />
            <h1>The beat of Israeli sport</h1>
            <p className={styles.lede}>
              Fast enough for the match. Serious enough for the story. Built in Israel for supporters everywhere.
            </p>
          </div>
          <div className={styles.heroMark}>
            <BrandMark />
            <div>
              <span>THE PULSE</span>
              <p>The italic ILSP wordmark has the speed of a sports-broadcast graphic. A small forward-leaning Magen David gives the compact icon a distinctly Israeli signature without turning it into flag decoration.</p>
            </div>
          </div>
        </div>
        <div className={styles.partnerStrip}>
          <span>ISRAEL SPORTS PULSE</span>
          <i />
          <small>PARTNER PRESENTATION</small>
          <b>YOUR BRAND</b>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <span>01 / Name</span>
          <div>
            <h2>Israel Sports Pulse. ILSP for short.</h2>
            <p>The full name carries Israel, sport and immediacy at first sight. ILSP gives the identity a compact form for avatars, apps, alerts and small mobile placements.</p>
          </div>
        </div>
        <div className={styles.nameGrid}>
          <article className={styles.nameWinner}>
            <span>Approved masterbrand</span>
            <h3>Israel Sports Pulse</h3>
            <p>The complete reader-facing name. Clear at launch, energetic in social formats and credible in a funding or partner presentation.</p>
            <div><b>ilsportspulse.com</b><small>No registry match at time of check</small></div>
          </article>
          <article>
            <span>Approved short form</span>
            <h3>ILSP</h3>
            <p>The compact expression for icons, app stores, score alerts and social shorthand. The full name remains visible wherever the audience first meets the brand.</p>
            <div><b>ILSP</b><small>Israel Sports Pulse</small></div>
          </article>
          <article>
            <span>Retired working name</span>
            <h3>IL Playbook</h3>
            <p>Distinctive and genuinely sporting in North America, but its business-manual meaning makes the proposition less immediate across future markets.</p>
            <div><b>ilplaybook.com</b><small>No registry match at time of check</small></div>
          </article>
          <article>
            <span>Clarity benchmark</span>
            <h3>Israel Sports Desk</h3>
            <p>Instantly credible and easy to understand in every market, although more descriptive than emotionally distinctive.</p>
            <div><b>israelsportsdesk.com</b><small>No registry match at time of check</small></div>
          </article>
        </div>
        <div className={styles.domainStrategy}>
          <div className={styles.domainIntro}>
            <span>DOMAIN SYSTEM</span>
            <h3>Short in public. Protected behind it.</h3>
            <p>Use one memorable address everywhere, then redirect the local and full-name domains to it.</p>
          </div>
          <div className={styles.domainList}>
            <div className={styles.domainPrimary}><b>ilsportspulse.com</b><span>Recommended public address</span><small>No registry record at time of check</small></div>
            <div><b>ilpulse.co.il</b><span>Israeli trust and defensive redirect</span><small>No registry record at time of check</small></div>
            <div><b>ilsportspulse.com</b><span>Abbreviated-name protection and redirect</span><small>No registry record at time of check</small></div>
          </div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.darkSection}`}>
        <div className={styles.sectionIntro}>
          <span>02 / Identity</span>
          <div>
            <h2>Israeli energy, not flag decoration.</h2>
            <p>The master logo uses only Israeli blue, white and broadcast navy, so it works in one colour on a shirt. Arena cyan is reserved for selected live-interface moments, never the primary sponsor wordmark.</p>
          </div>
        </div>
        <div className={styles.logoStage}>
          <div className={styles.logoLight}><Lockup /></div>
          <div className={styles.logoDark}><Lockup inverse /></div>
          <div className={styles.avatar}><BrandMark /><span>Social avatar</span></div>
        </div>
        <div className={styles.palette}>
          <div className={styles.navy}><b>Night Navy</b><span>#07152F</span></div>
          <div className={styles.blue}><b>Signal Blue</b><span>#155EEF</span></div>
          <div className={styles.accent}><b>Broadcast Blue</b><span>#4F7DFF</span></div>
          <div className={styles.sand}><b>Editorial Sand</b><span>#F5F2E9</span></div>
          <div className={styles.coral}><b>Alert Coral</b><span>#FF4D5A</span></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.shirtSection}`}>
        <div className={styles.sectionIntro}>
          <span>03 / Stress test</span>
          <div>
            <h2>If it works on a shirt, it works everywhere.</h2>
            <p>The sponsor lockup is transparent, one-colour capable and readable without a badge or tagline. The compact ILSP mark is reserved for the app, score bugs and small digital spaces.</p>
          </div>
        </div>
        <div className={styles.shirtGrid}>
          <article className={styles.kitStage}>
            <div className={styles.jersey}>
              <i />
              <Image alt="Israel Sports Pulse sponsor wordmark on a white football shirt" height={360} src="/brand/ilsp-lockup.svg?v=4" unoptimized width={1800} />
            </div>
            <span>LIGHT KIT · FULL SPONSOR LOCKUP</span>
          </article>
          <div className={styles.useTests}>
            <article className={styles.reverseTest}>
              <Image alt="White Israel Sports Pulse sponsor wordmark on navy" height={360} src="/brand/ilsp-lockup-white.svg?v=4" unoptimized width={1800} />
              <span>DARK KIT · ONE-COLOUR REVERSE</span>
            </article>
            <article className={styles.scaleTest}>
              <div className={styles.scaleRow}>
                <div><BrandMark /><small>32</small></div>
                <div><BrandMark /><small>48</small></div>
                <div><BrandMark /><small>96</small></div>
              </div>
              <span>APP, SCORE BUG AND BROADCAST SCALE</span>
            </article>
          </div>
        </div>
        <div className={styles.logoRules}>
          <b>Shirt rule</b>
          <span>No live accent in the sponsor wordmark</span>
          <span>No box behind the full lockup</span>
          <span>One-colour version always available</span>
          <span>Compact icon never replaces the full name at first contact</span>
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <span>04 / Voice</span>
          <div>
            <h2>Confident. Precise. Close to the action.</h2>
            <p>The brand should sound like an excellent sports desk, never like a fan account, translation service or automated feed.</p>
          </div>
        </div>
        <div className={styles.voiceGrid}>
          <article><b>Fast, not rushed</b><p>Publish the verified development and explain what changes next.</p></article>
          <article><b>Expert, not theatrical</b><p>Use the language of the sport. Let facts and analysis create the drama.</p></article>
          <article><b>Israeli, not partisan</b><p>Cover every club, league, athlete and community with the same professional standard.</p></article>
          <article><b>Global, not generic</b><p>Major international stories earn space when they matter to serious sports fans.</p></article>
        </div>
        <div className={styles.messageBand}>
          <span>MASTER LINE</span>
          <strong>The beat of Israeli sport</strong>
          <p>The name says what we cover; the line says why supporters should return throughout the day.</p>
        </div>
      </section>

      <section className={`${styles.section} ${styles.languageSection}`}>
        <div className={styles.sectionIntro}>
          <span>05 / Languages</span>
          <div>
            <h2>One masterbrand. Many reading directions.</h2>
            <p>The symbol must work without the English wordmark, while navigation, typography and story templates are designed for both left-to-right and right-to-left editions.</p>
          </div>
        </div>
        <div className={styles.languageGrid}>
          <article><span>EN</span><b>English</b><p>Launch edition and international sponsor language.</p></article>
          <article dir="rtl"><span>עב</span><b>עברית</b><p>מהדורה מקומית מלאה עם ממשק מימין לשמאל.</p></article>
          <article><span>FR</span><b>Français</b><p>A natural second diaspora edition when editorial capacity exists.</p></article>
          <article><span>ES</span><b>Español</b><p>A later growth edition with its own copy desk, not machine-only translation.</p></article>
        </div>
        <div className={styles.languageRules}>
          <div><b>Language-neutral mark</b><span>The icon remains recognisable without Latin letters.</span></div>
          <div><b>Native editorial review</b><span>Names, terminology and headlines are reviewed per language.</span></div>
          <div><b>RTL from the foundation</b><span>Layouts mirror intelligently; scorelines and data remain stable.</span></div>
          <div><b>Shared identity</b><span>No separate logos or accounts until an edition has enough daily output.</span></div>
        </div>
      </section>

      <section className={`${styles.section} ${styles.assetSection}`}>
        <div className={styles.sectionIntro}>
          <span>06 / Assets</span>
          <div>
            <h2>Ready for profiles, decks and launch pages.</h2>
            <p>The approved vector files remain sharp at every size. Use the social avatar inside a circular crop and keep the wordmark clear of photography or sponsor logos.</p>
          </div>
        </div>
        <div className={styles.assetGrid}>
          <a download href="/brand/ilsp-mark.svg">
            <Image alt="ILSP master mark" height={1024} src="/brand/ilsp-mark.svg?v=4" unoptimized width={1024} />
            <span><b>Master mark</b><small>SVG · compact sports identity</small></span>
          </a>
          <a download href="/brand/ilsp-lockup.svg">
            <Image alt="Israel Sports Pulse lockup" height={400} src="/brand/ilsp-lockup.svg?v=4" unoptimized width={1600} />
            <span><b>Master lockup</b><small>SVG · presentation and partner use</small></span>
          </a>
          <a download href="/brand/ilsp-social-avatar.svg">
            <Image alt="ILSP social avatar" height={1080} src="/brand/ilsp-social-avatar.svg?v=4" unoptimized width={1080} />
            <span><b>Social avatar</b><small>SVG · safe for circular crops</small></span>
          </a>
          <a download href="/brand/ilsp-social-banner.svg">
            <Image alt="Israel Sports Pulse social banner" height={500} src="/brand/ilsp-social-banner.svg?v=4" unoptimized width={1500} />
            <span><b>Social banner</b><small>SVG · 3:1 master canvas</small></span>
          </a>
          <a download href="/brand/ilsp-lockup-white.svg">
            <Image alt="White Israel Sports Pulse sponsor wordmark" height={360} src="/brand/ilsp-lockup-white.svg?v=4" unoptimized width={1800} />
            <span><b>Reverse sponsor lockup</b><small>SVG · dark kits and placements</small></span>
          </a>
        </div>
      </section>

      <section className={`${styles.section} ${styles.socialSection}`}>
        <div className={styles.sectionIntro}>
          <span>07 / Social</span>
          <div>
            <h2>One handle. Different jobs.</h2>
            <p>Reserve the same identity everywhere, then adapt the format to the platform instead of copying the same post seven times.</p>
          </div>
        </div>
        <div className={styles.channelList}>
          {channels.map(([channel, handle, role]) => (
            <div key={channel}>
              <b>{channel}</b><strong>{handle}</strong><span>{role}</span>
            </div>
          ))}
        </div>
        <p className={styles.availabilityNote}>Preferred handle: <b>@ILSportsPulse</b> · short campaign form: <b>#ILSP</b> · final availability must be confirmed during registration.</p>
      </section>

      <section className={styles.section}>
        <div className={styles.sectionIntro}>
          <span>08 / Commercial</span>
          <div>
            <h2>Sponsor the value, not the journalism.</h2>
            <p>Partners should own useful, clearly labelled products—never editorial conclusions or story selection.</p>
          </div>
        </div>
        <div className={styles.commercialGrid}>
          <article><span>01</span><h3>Founding Partner</h3><p>Site-wide recognition, launch campaign and first refusal on major seasonal packages.</p></article>
          <article><span>02</span><h3>Match Centre</h3><p>High-frequency utility sponsorship around scores, fixtures, tables and alerts.</p></article>
          <article><span>03</span><h3>Daily Five</h3><p>A repeatable quiz product with strong habit and social-sharing potential.</p></article>
          <article><span>04</span><h3>From the Archive</h3><p>Premium storytelling aligned with heritage, community and Jewish sporting memory.</p></article>
        </div>
        <div className={styles.rules}>
          <b>Non-negotiable</b>
          <span>Sponsored labels stay visible</span>
          <span>No sponsor approval of editorial copy</span>
          <span>No betting sponsor in youth-facing products</span>
          <span>Corrections and source standards remain independent</span>
        </div>
      </section>

      <footer className={styles.footer}>
        <Lockup inverse compact />
        <p>Approved locally. External gate: confirm trademark clearance, then register domains and social handles before public launch.</p>
      </footer>
    </main>
  );
}
