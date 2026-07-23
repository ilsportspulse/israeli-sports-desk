"use client";

import { useEffect, useRef, useState } from "react";

const TYPES = [
  { value: "partnership", label: "Partnership" },
  { value: "sponsorship", label: "Sponsorship" },
  { value: "media-licence", label: "Club / league media use" },
  { value: "other", label: "Something else" },
];

export function PartnerContactForm() {
  const renderedAt = useRef<number>(0);
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  useEffect(() => { renderedAt.current = Date.now(); }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/partner-contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: data.get("type"),
          name: data.get("name"),
          org: data.get("org"),
          email: data.get("email"),
          message: data.get("message"),
          company_url: data.get("company_url"), // honeypot
          renderedAt: renderedAt.current,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || "Something went wrong. Please try again."); setState("error"); return; }
      setState("sent"); form.reset();
    } catch {
      setError("Network error. Please try again, or e-mail partnership@ilsportspulse.com."); setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="pc-sent" role="status">
        <h3>Thank you — your message is with us.</h3>
        <p>We read every partnership and sponsorship enquiry personally and reply from <b>partnership@ilsportspulse.com</b>, usually within a couple of working days.</p>
      </div>
    );
  }

  return (
    <form className="pc-form" onSubmit={onSubmit} noValidate>
      {/* Honeypot: hidden from humans, catches bots. */}
      <div aria-hidden="true" style={{ position: "absolute", left: "-9999px", top: "-9999px" }}>
        <label>Company URL<input type="text" name="company_url" tabIndex={-1} autoComplete="off" /></label>
      </div>

      <div className="pc-field">
        <label htmlFor="pc-type">What is your enquiry about?</label>
        <select id="pc-type" name="type" required defaultValue="partnership">
          {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="pc-row">
        <div className="pc-field">
          <label htmlFor="pc-name">Your name</label>
          <input id="pc-name" name="name" type="text" required maxLength={120} autoComplete="name" />
        </div>
        <div className="pc-field">
          <label htmlFor="pc-org">Organisation</label>
          <input id="pc-org" name="org" type="text" maxLength={160} autoComplete="organization" placeholder="Company, club or brand" />
        </div>
      </div>
      <div className="pc-field">
        <label htmlFor="pc-email">Work e-mail</label>
        <input id="pc-email" name="email" type="email" required maxLength={160} autoComplete="email" />
      </div>
      <div className="pc-field">
        <label htmlFor="pc-message">How would you like to work with us?</label>
        <textarea id="pc-message" name="message" required minLength={20} maxLength={4000} rows={6}
          placeholder="A few lines on what you have in mind — the audience you want to reach, the kind of activation or support, timing. No attachments needed yet; we'll ask by reply." />
      </div>
      {state === "error" && <p className="pc-error" role="alert">{error}</p>}
      <div className="pc-actions">
        <button className="pc-submit" type="submit" disabled={state === "sending"}>
          {state === "sending" ? "Sending…" : "Send enquiry"}
        </button>
        <span className="pc-alt">or e-mail <a href="mailto:partnership@ilsportspulse.com">partnership@ilsportspulse.com</a></span>
      </div>
      <p className="pc-privacy">We use your details only to reply to this enquiry. No newsletters, no sharing. Protected against spam.</p>
    </form>
  );
}
