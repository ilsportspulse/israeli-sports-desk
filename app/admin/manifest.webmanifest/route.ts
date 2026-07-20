// Installable PWA manifest for the backoffice, so staff can add it to their iOS /
// Android home screen and run it full-screen like a native admin app.
export async function GET() {
  const manifest = {
    name: "ILSP Backoffice",
    short_name: "ILSP Admin",
    description: "Israel Sports Pulse — newsroom control panel",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#07142c",
    theme_color: "#07142c",
    icons: [
      { src: "/brand/ilsp-mark.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
  return new Response(JSON.stringify(manifest), {
    headers: { "Content-Type": "application/manifest+json", "Cache-Control": "public, max-age=3600" },
  });
}
