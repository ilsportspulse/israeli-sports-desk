export function TeamCrest({
  name,
  logo,
  alternate = false,
}: {
  name: string;
  logo?: string | null;
  alternate?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  return logo ? (
    <span
      className="team-crest team-crest-image"
      role="img"
      aria-label={`${name} crest`}
      style={{ backgroundImage: `url("${logo}")` }}
    />
  ) : (
    <span className={`team-crest team-crest-fallback${alternate ? " alt" : ""}`} aria-hidden="true">
      {initials}
    </span>
  );
}
