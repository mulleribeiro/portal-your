"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

type Copy = {
  eyebrow: string;
  title: string;
  description: string;
  email: string;
  consent: string;
  privacy: string;
  submit: string;
  sending: string;
  success: string;
  error: string;
};

const COPY: Record<string, Copy> = {
  pt: {
    eyebrow: "Clube YOUR",
    title: "A YOUR na sua caixa de entrada",
    description: "Receba novidades, edições e curadorias. Sem excesso: só o melhor da YOUR.",
    email: "Seu e-mail",
    consent: "Aceito receber novidades por e-mail e posso cancelar a inscrição quando quiser.",
    privacy: "Política de privacidade",
    submit: "Quero receber",
    sending: "Enviando…",
    success: "Obrigado! Seu e-mail foi cadastrado.",
    error: "Não foi possível concluir o cadastro. Tente novamente.",
  },
  en: {
    eyebrow: "YOUR Club",
    title: "YOUR in your inbox",
    description: "Get the latest issues, stories and curation from YOUR — only the good stuff.",
    email: "Your email",
    consent: "I agree to receive email updates and can unsubscribe at any time.",
    privacy: "Privacy policy",
    submit: "Sign me up",
    sending: "Sending…",
    success: "Thank you! Your email has been registered.",
    error: "We could not complete your registration. Please try again.",
  },
  es: {
    eyebrow: "Club YOUR",
    title: "YOUR en tu bandeja de entrada",
    description: "Recibe novedades, ediciones y curadurías de YOUR. Solo lo mejor.",
    email: "Tu correo electrónico",
    consent: "Acepto recibir novedades por correo y puedo cancelar la suscripción cuando quiera.",
    privacy: "Política de privacidad",
    submit: "Quiero suscribirme",
    sending: "Enviando…",
    success: "¡Gracias! Tu correo se ha registrado.",
    error: "No pudimos completar el registro. Inténtalo de nuevo.",
  },
  fr: {
    eyebrow: "Club YOUR",
    title: "YOUR dans votre boîte mail",
    description: "Recevez les nouveautés, éditions et sélections de YOUR.",
    email: "Votre e-mail",
    consent: "J'accepte de recevoir des actualités par e-mail et peux me désinscrire à tout moment.",
    privacy: "Politique de confidentialité",
    submit: "Je m'inscris",
    sending: "Envoi…",
    success: "Merci ! Votre adresse e-mail est enregistrée.",
    error: "L'inscription a échoué. Veuillez réessayer.",
  },
  it: {
    eyebrow: "Club YOUR",
    title: "YOUR nella tua casella e-mail",
    description: "Ricevi novità, edizioni e selezioni di YOUR.",
    email: "La tua e-mail",
    consent: "Acconsento a ricevere aggiornamenti via e-mail e posso annullare l'iscrizione in qualsiasi momento.",
    privacy: "Informativa sulla privacy",
    submit: "Iscrivimi",
    sending: "Invio…",
    success: "Grazie! La tua e-mail è stata registrata.",
    error: "Non è stato possibile completare l'iscrizione. Riprova.",
  },
  de: {
    eyebrow: "YOUR Club",
    title: "YOUR in deinem Posteingang",
    description: "Erhalte Neuigkeiten, Ausgaben und Empfehlungen von YOUR.",
    email: "Deine E-Mail-Adresse",
    consent: "Ich möchte E-Mail-Updates erhalten und kann mich jederzeit abmelden.",
    privacy: "Datenschutzerklärung",
    submit: "Anmelden",
    sending: "Wird gesendet…",
    success: "Vielen Dank! Deine E-Mail-Adresse wurde gespeichert.",
    error: "Die Anmeldung ist fehlgeschlagen. Bitte versuche es erneut.",
  },
};

export function NewsletterSignup({
  lang,
  source = "footer",
  variant = "plain",
}: {
  lang: string;
  source?: "footer" | "subscribe-page" | "home";
  variant?: "plain" | "card";
}) {
  const copy = COPY[lang] || COPY.pt;
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    try {
      const response = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, consent, lang, source, website }),
      });
      if (!response.ok) throw new Error("Subscription request failed");
      setEmail("");
      setConsent(false);
      setWebsite("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section className={`min-w-0 max-w-full ${variant === "card" ? "rounded-2xl border border-line bg-surface p-5 sm:p-7" : ""}`} aria-labelledby={`newsletter-title-${source}`}>
      <p className="eyebrow mb-2">{copy.eyebrow}</p>
      <h2 id={`newsletter-title-${source}`} className="font-display text-2xl font-extrabold uppercase">{copy.title}</h2>
      <p className="mt-2 max-w-[42ch] text-sm text-mute">{copy.description}</p>

      <form className="mt-4 grid min-w-0 gap-3" onSubmit={submit}>
        <div className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="sr-only" htmlFor={`newsletter-email-${source}`}>{copy.email}</label>
          <input
            id={`newsletter-email-${source}`}
            className="field min-w-0"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            maxLength={320}
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={copy.email}
            disabled={status === "sending"}
          />
          <button className="btn btn-pri w-full sm:w-auto" type="submit" disabled={status === "sending" || !consent}>
            {status === "sending" ? copy.sending : copy.submit}
          </button>
        </div>

        <input
          type="text"
          name="website"
          value={website}
          onChange={(event) => setWebsite(event.target.value)}
          className="pointer-events-none absolute -left-[10000px] h-px w-px opacity-0"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
        />

        <label className="flex min-w-0 items-start gap-2 text-xs leading-relaxed text-mute">
          <input
            className="mt-0.5 size-4 shrink-0 accent-[var(--color-blush)]"
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
            required
            disabled={status === "sending"}
          />
          <span className="min-w-0">{copy.consent} <Link className="underline decoration-blush underline-offset-2" href={`/${lang}/privacy`}>{copy.privacy}</Link>.</span>
        </label>

        <p className="min-h-5 text-sm" role="status" aria-live="polite">
          {status === "success" ? <span className="text-blush">{copy.success}</span> : null}
          {status === "error" ? <span className="text-red-300">{copy.error}</span> : null}
        </p>
      </form>
    </section>
  );
}
