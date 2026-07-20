import { siteConfig } from "@/config/site";

export function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand-mark${small ? " small" : ""}`} aria-hidden="true">
      <svg viewBox="0 0 96 96">
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
    </span>
  );
}

export function BrandLockup() {
  return (
    <>
      <BrandMark />
      <span className="brand-copy">
        <strong><span>ISRAEL</span> <em>SPORTS</em> PULSE</strong>
        <small>{siteConfig.tagline}</small>
      </span>
    </>
  );
}
