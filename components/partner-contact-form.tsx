"use client";

import { useEffect, useRef, useState } from "react";

import { defaultLocale, type LocaleCode } from "@/lib/locales";

const PC: Record<LocaleCode, {
  types: { value: string; label: string }[];
  genericError: string;
  networkError: string;
  sentHeading: string;
  sentBody: string;
  enquiryLabel: string;
  nameLabel: string;
  orgLabel: string;
  orgPlaceholder: string;
  emailLabel: string;
  messageLabel: string;
  messagePlaceholder: string;
  sending: string;
  send: string;
  orEmail: string;
  privacy: string;
}> = {
  en: {
    types: [
      { value: "partnership", label: "Partnership" },
      { value: "sponsorship", label: "Sponsorship" },
      { value: "media-licence", label: "Club / league media use" },
      { value: "other", label: "Something else" },
    ],
    genericError: "Something went wrong. Please try again.",
    networkError: "Network error. Please try again, or e-mail partnership@ilsportspulse.com.",
    sentHeading: "Thank you — your message is with us.",
    sentBody: "We read every partnership and sponsorship enquiry personally and reply from partnership@ilsportspulse.com, usually within a couple of working days.",
    enquiryLabel: "What is your enquiry about?",
    nameLabel: "Your name",
    orgLabel: "Organisation",
    orgPlaceholder: "Company, club or brand",
    emailLabel: "Work e-mail",
    messageLabel: "How would you like to work with us?",
    messagePlaceholder: "A few lines on what you have in mind — the audience you want to reach, the kind of activation or support, timing. No attachments needed yet; we'll ask by reply.",
    sending: "Sending…",
    send: "Send enquiry",
    orEmail: "or e-mail",
    privacy: "We use your details only to reply to this enquiry. No newsletters, no sharing. Protected against spam.",
  },
  fr: {
    types: [
      { value: "partnership", label: "Partenariat" },
      { value: "sponsorship", label: "Parrainage" },
      { value: "media-licence", label: "Usage média club / ligue" },
      { value: "other", label: "Autre chose" },
    ],
    genericError: "Une erreur s’est produite. Veuillez réessayer.",
    networkError: "Erreur réseau. Veuillez réessayer ou écrire à partnership@ilsportspulse.com.",
    sentHeading: "Merci — votre message nous est bien parvenu.",
    sentBody: "Nous lisons personnellement chaque demande de partenariat et de parrainage et répondons depuis partnership@ilsportspulse.com, généralement sous quelques jours ouvrés.",
    enquiryLabel: "Quel est l’objet de votre demande ?",
    nameLabel: "Votre nom",
    orgLabel: "Organisation",
    orgPlaceholder: "Entreprise, club ou marque",
    emailLabel: "E-mail professionnel",
    messageLabel: "Comment souhaitez-vous travailler avec nous ?",
    messagePlaceholder: "Quelques lignes sur ce que vous avez en tête — le public que vous voulez toucher, le type d’activation ou de soutien, le calendrier. Aucune pièce jointe nécessaire pour l’instant ; nous vous solliciterons en réponse.",
    sending: "Envoi…",
    send: "Envoyer la demande",
    orEmail: "ou écrivez à",
    privacy: "Nous n’utilisons vos coordonnées que pour répondre à cette demande. Pas de newsletters, pas de partage. Protégé contre le spam.",
  },
  es: {
    types: [
      { value: "partnership", label: "Alianza" },
      { value: "sponsorship", label: "Patrocinio" },
      { value: "media-licence", label: "Uso mediático de club / liga" },
      { value: "other", label: "Otra cosa" },
    ],
    genericError: "Algo salió mal. Inténtalo de nuevo.",
    networkError: "Error de red. Inténtalo de nuevo o escribe a partnership@ilsportspulse.com.",
    sentHeading: "Gracias — tu mensaje está con nosotros.",
    sentBody: "Leemos personalmente cada consulta de alianza y patrocinio y respondemos desde partnership@ilsportspulse.com, normalmente en un par de días laborables.",
    enquiryLabel: "¿Sobre qué es tu consulta?",
    nameLabel: "Tu nombre",
    orgLabel: "Organización",
    orgPlaceholder: "Empresa, club o marca",
    emailLabel: "Correo profesional",
    messageLabel: "¿Cómo te gustaría trabajar con nosotros?",
    messagePlaceholder: "Unas líneas sobre lo que tienes en mente — la audiencia que quieres alcanzar, el tipo de activación o apoyo, los plazos. No hacen falta adjuntos todavía; te los pediremos en la respuesta.",
    sending: "Enviando…",
    send: "Enviar consulta",
    orEmail: "o escribe a",
    privacy: "Usamos tus datos solo para responder a esta consulta. Sin newsletters, sin compartir. Protegido contra spam.",
  },
};

export function PartnerContactForm({ locale = defaultLocale }: { locale?: LocaleCode }) {
  const pc = PC[locale] ?? PC[defaultLocale];
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
      if (!res.ok) { setError(json.error || pc.genericError); setState("error"); return; }
      setState("sent"); form.reset();
    } catch {
      setError(pc.networkError); setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="pc-sent" role="status">
        <h3>{pc.sentHeading}</h3>
        <p>{pc.sentBody}</p>
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
        <label htmlFor="pc-type">{pc.enquiryLabel}</label>
        <select id="pc-type" name="type" required defaultValue="partnership">
          {pc.types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>
      <div className="pc-row">
        <div className="pc-field">
          <label htmlFor="pc-name">{pc.nameLabel}</label>
          <input id="pc-name" name="name" type="text" required maxLength={120} autoComplete="name" />
        </div>
        <div className="pc-field">
          <label htmlFor="pc-org">{pc.orgLabel}</label>
          <input id="pc-org" name="org" type="text" maxLength={160} autoComplete="organization" placeholder={pc.orgPlaceholder} />
        </div>
      </div>
      <div className="pc-field">
        <label htmlFor="pc-email">{pc.emailLabel}</label>
        <input id="pc-email" name="email" type="email" required maxLength={160} autoComplete="email" />
      </div>
      <div className="pc-field">
        <label htmlFor="pc-message">{pc.messageLabel}</label>
        <textarea id="pc-message" name="message" required minLength={20} maxLength={4000} rows={6}
          placeholder={pc.messagePlaceholder} />
      </div>
      {state === "error" && <p className="pc-error" role="alert">{error}</p>}
      <div className="pc-actions">
        <button className="pc-submit" type="submit" disabled={state === "sending"}>
          {state === "sending" ? pc.sending : pc.send}
        </button>
        <span className="pc-alt">{pc.orEmail} <a href="mailto:partnership@ilsportspulse.com">partnership@ilsportspulse.com</a></span>
      </div>
      <p className="pc-privacy">{pc.privacy}</p>
    </form>
  );
}
