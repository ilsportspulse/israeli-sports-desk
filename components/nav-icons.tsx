// Filled, glossy "3D-ish" icons for the mobile bottom nav. Each glyph has a blue
// gradient body + a soft top highlight so it reads dimensional at small sizes.
// The active tab brightens and pops (see .mobile-bottom-nav CSS).

type Props = { active?: boolean };

function grads(id: string, active: boolean) {
  const top = active ? "#5f96ff" : "#aeb8c6";
  const mid = active ? "#1f6bff" : "#8b97a8";
  const bot = active ? "#0b44c9" : "#6c7889";
  return (
    <defs>
      <linearGradient id={`${id}-b`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor={top} />
        <stop offset="0.55" stopColor={mid} />
        <stop offset="1" stopColor={bot} />
      </linearGradient>
      <linearGradient id={`${id}-g`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.5" />
        <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>
    </defs>
  );
}

export function NavHome({ active }: Props) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="nav3d" aria-hidden="true">
      {grads("nh", !!active)}
      <path d="M12 3.2 3.4 10.4c-.5.4-.2 1.2.4 1.2H5v7.6c0 .6.5 1.1 1.1 1.1H9.5v-4.6c0-.6.5-1.1 1.1-1.1h2.8c.6 0 1.1.5 1.1 1.1V20.3h3.4c.6 0 1.1-.5 1.1-1.1V11.6h1.2c.6 0 .9-.8.4-1.2Z" fill="url(#nh-b)" />
      <path d="M12 3.2 3.4 10.4c-.5.4-.2 1.2.4 1.2H5l7-5.8 7 5.8h1.2c.6 0 .9-.8.4-1.2Z" fill="url(#nh-g)" />
    </svg>
  );
}

export function NavGlobe({ active }: Props) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="nav3d" aria-hidden="true">
      {grads("ng", !!active)}
      <circle cx="12" cy="12" r="8.6" fill="url(#ng-b)" />
      <ellipse cx="12" cy="9.4" rx="8" ry="3.4" fill="url(#ng-g)" />
      <g fill="none" stroke="#ffffff" strokeOpacity="0.85" strokeWidth="1">
        <path d="M3.6 10.4h16.8M4.4 15h15.2" />
        <path d="M12 3.4c2.6 2.4 3.9 5.4 3.9 8.6s-1.3 6.2-3.9 8.6c-2.6-2.4-3.9-5.4-3.9-8.6S9.4 5.8 12 3.4Z" />
      </g>
    </svg>
  );
}

export function NavRetro({ active }: Props) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="nav3d" aria-hidden="true">
      {grads("nr", !!active)}
      <circle cx="12" cy="12" r="8.6" fill="url(#nr-b)" />
      <ellipse cx="12" cy="9.4" rx="8" ry="3.4" fill="url(#nr-g)" />
      <path d="M11.4 7.6 6.6 12l4.8 4.4Zm5.4 0L12 12l4.8 4.4Z" fill="#ffffff" fillOpacity="0.95" />
    </svg>
  );
}

export function NavScores({ active }: Props) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" className="nav3d" aria-hidden="true">
      {grads("ns", !!active)}
      <path d="M13.6 2.4 4.6 13.2c-.4.5-.1 1.2.5 1.2H10l-1.5 6.8c-.1.7.8 1.1 1.2.5l9-10.8c.4-.5.1-1.2-.5-1.2H13.6l1.5-6.6c.1-.7-.8-1.1-1.2-.5Z" fill="url(#ns-b)" />
      <path d="M13.6 2.4 4.6 13.2c-.4.5-.1 1.2.5 1.2h1.1l7.4-9-.6 2.6h1.9Z" fill="url(#ns-g)" />
    </svg>
  );
}
