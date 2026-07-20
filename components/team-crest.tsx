import { getClubCrest } from "@/lib/israeli-clubs";

export function TeamCrest({
  name,
  logo,
  alternate = false,
}: {
  name: string;
  logo?: string | null;
  alternate?: boolean;
}) {
  if (logo) {
    return (
      <span
        className="team-crest team-crest-image"
        role="img"
        aria-label={`${name} crest`}
        style={{ backgroundImage: `url("${logo}")` }}
      />
    );
  }

  // No licensed logo: render a recognisable, on-brand monogram in the club's
  // colours (see lib/israeli-clubs). Not the official trademarked crest.
  const crest = getClubCrest(name);
  return (
    <span
      className={`team-crest team-crest-fallback${alternate ? " alt" : ""}`}
      aria-hidden="true"
      style={{ background: crest.bg, color: crest.fg }}
    >
      {crest.label}
    </span>
  );
}
