"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import {
  localeFromPathname,
  pathForLocale,
  publicLocales,
  type LocaleCode,
} from "@/lib/locales";
import { GlobeIcon } from "@/components/icons";

// Persist the reader's choice so future visits and internal links can honour it.
function rememberLocale(locale: LocaleCode) {
  try {
    document.cookie = `ilsp_locale=${locale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  } catch {
    /* non-fatal */
  }
}

export function LanguageSwitcher({ label = "Language" }: { label?: string }) {
  const pathname = usePathname() || "/";
  const current = localeFromPathname(pathname);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const activeDef = publicLocales.find((l) => l.code === current) ?? publicLocales[0];

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        type="button"
        className="icon-button lang-switcher-button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        <GlobeIcon size={18} />
        <span className="lang-switcher-code">{current.toUpperCase()}</span>
      </button>
      {open ? (
        <ul className="lang-switcher-menu" role="listbox" aria-label={label}>
          {publicLocales.map((locale) => (
            <li key={locale.code} role="option" aria-selected={locale.code === current}>
              <Link
                href={pathForLocale(pathname, locale.code)}
                hrefLang={locale.code}
                className={locale.code === current ? "active" : ""}
                onClick={() => {
                  rememberLocale(locale.code);
                  setOpen(false);
                }}
              >
                <span>{locale.nativeLabel}</span>
                <small>{locale.code.toUpperCase()}</small>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <span className="sr-only">{activeDef.nativeLabel}</span>
    </div>
  );
}
