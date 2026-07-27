"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ArrowIcon } from "@/components/icons";
import { formatArticleDate } from "@/lib/articles";
import { translator } from "@/lib/i18n/ui";
import { defaultLocale, type LocaleCode } from "@/lib/locales";
import { LocalizedLink as Link } from "@/components/localized-link";
import type { SocialWatchItem } from "@/lib/social-watch";

// "The Pulse" — a live mosaic of verified Israeli voices. Photo posts become
// large tiles, text posts compact quote cards; the wall re-polls the API each
// minute and slides fresh posts in behind a "+N new" pill so reading is never
// interrupted mid-scroll.

type Filter = "all" | "news" | "voices";


function filterOf(item: SocialWatchItem): Exclude<Filter, "all"> {
  const g = item.group ?? "";
  if (g === "israeli-clubs" || g === "israeli-basketball-federations" || g === "israeli-players") return "voices";
  return "news";
}

export function IsraeliNewsWatcher({ initial, locale = defaultLocale }: { initial: SocialWatchItem[]; locale?: LocaleCode }) {
  const tr = translator(locale);
  const [items, setItems] = useState<SocialWatchItem[]>(initial);
  const [pending, setPending] = useState<SocialWatchItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [tick, setTick] = useState(0);
  const knownUrls = useRef(new Set(initial.map((i) => i.url)));

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/social-watch", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: SocialWatchItem[] };
      const fresh = data.items.filter((i) => !knownUrls.current.has(i.url));
      if (fresh.length) setPending((p) => {
        const seen = new Set(p.map((x) => x.url));
        return [...fresh.filter((f) => !seen.has(f.url)), ...p];
      });
    } catch {
      /* offline/na — next tick retries */
    }
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTick((t) => t + 1);
      void refresh();
    }, 60_000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const absorb = () => {
    setItems((current) => {
      const merged = [...pending, ...current];
      for (const p of pending) knownUrls.current.add(p.url);
      return merged.slice(0, 24);
    });
    setPending([]);
  };

  const visible = useMemo(
    () => items.filter((i) => filter === "all" || filterOf(i) === filter),
    [items, filter],
  );

  const chips: { key: Filter; label: string }[] = [
    { key: "all", label: tr("social.filterAll") },
    { key: "news", label: tr("social.filterNews") },
    { key: "voices", label: tr("social.filterVoices") },
  ];

  if (!items.length) return null;
  return (
    <section className="topstories-block sw-block" id="social-watch" aria-label={tr("social.heading")}>
      <div className="page-width">
        <div className="ts-head sw-head">
          <span className="hero-heading-bar" />
          <h2>{tr("social.heading")}</h2>
          <span className="sw-live" aria-live="off"><span className="sw-live-dot" aria-hidden="true" />{tr("social.live")}</span>
        </div>
        <p className="sw-blurb">{tr("social.blurb")}</p>
        <div className="sw-toolbar" role="toolbar" aria-label={tr("social.heading")}>
          {chips.map((c) => (
            <button
              key={c.key}
              type="button"
              className={`sw-chip${filter === c.key ? " active" : ""}`}
              onClick={() => setFilter(c.key)}
            >
              {c.label}
            </button>
          ))}
          {pending.length ? (
            <button type="button" className="sw-chip sw-new" onClick={absorb}>
              +{pending.length} {tr("social.newPosts")}
            </button>
          ) : null}
        </div>
        <div className="sw-mosaic" data-tick={tick}>
          {visible.map((item) => (
            <article key={item.url} className={`sw-card${item.photoUrl ? " has-photo" : ""}`}>
              {item.photoUrl ? (
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="sw-photo">
                  {/* eslint-disable-next-line @next/next/no-img-element -- X CDN preview, remote host not in next/image allow-list */}
                  <img src={item.photoUrl} alt="" loading="lazy" />
                </a>
              ) : null}
              <div className="sw-body">
                <header>
                  <span className="sw-handle">{item.handle}</span>
                  <time dateTime={item.postedAt}>{formatArticleDate(item.postedAt, true, locale)}</time>
                </header>
                {item.text ? <blockquote dir="auto">{item.text}</blockquote> : null}
                <footer>
                  <a href={item.url} target="_blank" rel="noopener noreferrer">{tr("social.viewPost")} <ArrowIcon size={14} /></a>
                  {item.relatedSlug ? (
                    <Link href={`/article/${item.relatedSlug}`}>{tr("social.readStory")} <ArrowIcon size={14} /></Link>
                  ) : null}
                </footer>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// Compact light-theme rail for the top of the page: replaces the static
// "Most followed" list with the country's live pulse. Pure CSS auto-scroll,
// pauses on hover; links jump out to X or down to the full wall.
// Recognisable Israeli outlet identities for the rail — display name plus a
// brand accent, so the wall reads like a newsstand instead of a list of handles.
const OUTLETS: Record<string, { name: string; color: string }> = {
  "@ynetnews": { name: "Ynet", color: "#d9232e" },
  "@ynetalerts": { name: "Ynet", color: "#d9232e" },
  "@jerusalem_post": { name: "The Jerusalem Post", color: "#1a5dab" },
  "@haaretzcom": { name: "Haaretz", color: "#0b67c2" },
  "@timesofisrael": { name: "Times of Israel", color: "#2a6fb0" },
  "@i24news_he": { name: "i24NEWS", color: "#e4002b" },
  "@i24news_en": { name: "i24NEWS", color: "#e4002b" },
  "@maarivonline": { name: "Maariv", color: "#c8102e" },
  "@n12news": { name: "N12", color: "#e87722" },
  "@kann_news": { name: "Kan", color: "#6f2c91" },
  "@now14israel": { name: "Channel 14", color: "#0e7a3d" },
  "@glzradio": { name: "Galei Tzahal", color: "#4a6741" },
};
const outletOf = (handle: string) =>
  OUTLETS[handle.toLowerCase()] ?? { name: handle, color: "var(--accent, #2563eb)" };

export function NewsWatchRail({ items, locale = defaultLocale }: { items: SocialWatchItem[]; locale?: LocaleCode }) {
  const tr = translator(locale);
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const pausedRef = useRef(false);

  // JS-driven auto-scroll instead of a CSS marquee, so the reader can also
  // wheel/drag through the feed manually; auto-advance pauses on interaction
  // and resumes two seconds after the last touch. The list is rendered twice
  // for a seamless loop. Reduced-motion users get a plain scrollable list.
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let resumeTimer: number | undefined;
    const pause = () => {
      pausedRef.current = true;
      window.clearTimeout(resumeTimer);
      resumeTimer = window.setTimeout(() => { pausedRef.current = false; }, 2000);
    };
    el.addEventListener("wheel", pause, { passive: true });
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("pointerenter", pause);
    const id = window.setInterval(() => {
      if (pausedRef.current) return;
      const half = el.scrollHeight / 2;
      el.scrollTop = el.scrollTop >= half ? el.scrollTop - half + 1 : el.scrollTop + 1;
    }, 40);
    return () => {
      window.clearInterval(id);
      window.clearTimeout(resumeTimer);
      el.removeEventListener("wheel", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("pointerenter", pause);
    };
  }, [items.length]);

  if (!items.length) return null;
  return (
    <div className="trending-card sw-rail">
      <div className="section-heading compact">
        <div>
          <span className="eyebrow sw-live"><span className="sw-live-dot" aria-hidden="true" />{tr("social.live")}</span>
          <h2>{tr("social.heading")}</h2>
        </div>
      </div>
      <div className="sw-ticker sw-ticker-light sw-ticker-scroll" ref={scrollerRef}>
        <div className="sw-ticker-track">
          {[...items, ...items].map((item, i) => {
            const outlet = outletOf(item.handle);
            return (
              <div key={`${item.url}-${i}`} className="sw-tick-wrap" style={{ borderLeftColor: outlet.color }}>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="sw-tick">
                  <span className="sw-tick-main">
                    <span className="sw-handle" style={{ color: outlet.color }}>{outlet.name}</span>
                    <span className="sw-tick-text" dir="auto">{item.text.length > 120 ? `${item.text.slice(0, 117)}…` : item.text}</span>
                    <time dateTime={item.postedAt}>{formatArticleDate(item.postedAt, true, locale)}</time>
                  </span>
                  {item.photoUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element -- external X CDN thumb */
                    <img src={item.photoUrl} alt="" loading="lazy" className="sw-tick-thumb" />
                  )}
                </a>
                {item.relatedSlug && (
                  <Link href={`/story/${item.relatedSlug}`} className="sw-tick-related">{tr("social.readStory")} →</Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
