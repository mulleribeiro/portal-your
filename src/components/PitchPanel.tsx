"use client";

import { useCallback, useRef, useState } from "react";

type Uploaded = { url: string; name: string; kind: "photo" | "doc" };

type Copy = Record<string, string>;

const COPY: Record<string, Copy> = {
  pt: {
    kicker: "Aberto a jornalistas, assessores e leitores",
    title: "Envie sua sugestão de pauta",
    intro: "Tem uma história, um cliente, um lançamento ou um bastidor que merece cobertura? Preencha o formulário abaixo. Nossa redação avalia todas as propostas e entra em contato quando houver encaixe editorial.",
    name: "Nome da pauta",
    namePh: "Ex.: A nova geração de vinhos brasileiros conquista Paris",
    client: "Cliente / Marca (opcional)",
    clientPh: "Ex.: Nino Cucina, Belmond, Maserati…",
    journalist: "Nome do jornalista ou assessor",
    journalistPh: "Seu nome completo",
    role: "Veículo / Assessoria (opcional)",
    rolePh: "Ex.: Revista Época, Stampa Comunicação…",
    email: "E-mail para retorno",
    emailPh: "voce@veiculo.com.br",
    phone: "Telefone / WhatsApp (opcional)",
    phonePh: "(11) 99999-9999",
    message: "Texto da pauta",
    messagePh: "Descreva o gancho, os personagens, a data, o que já está feito e o que precisa ser produzido…",
    attachments: "Fotos e PDFs (opcional)",
    attachmentsHint: "Arraste os arquivos ou clique para selecionar. Fotos (JPG, PNG, WEBP) e documentos PDF, até 15 MB por arquivo.",
    choose: "Selecionar arquivos",
    sending: "Enviando pauta…",
    submit: "Enviar sugestão de pauta",
    sent: "Pauta enviada! Nossa redação recebeu sua sugestão e retornará em até 2 dias úteis.",
    sendAnother: "Enviar outra pauta",
    required: "campo obrigatório",
    remove: "remover",
    photo: "foto",
    doc: "pdf",
    privacy: "Ao enviar, você concorda que a YOUR Magazine entre em contato sobre esta proposta editorial.",
  },
  en: {
    kicker: "Open to journalists, PR staff and readers",
    title: "Send us your story pitch",
    intro: "Got a story, a client, a launch or a behind-the-scenes that deserves coverage? Fill in the form below. Our newsroom reviews every proposal and gets in touch when there is an editorial fit.",
    name: "Pitch name",
    namePh: "e.g. The new generation of Brazilian wines conquers Paris",
    client: "Client / Brand (optional)",
    clientPh: "e.g. Nino Cucina, Belmond, Maserati…",
    journalist: "Journalist or PR name",
    journalistPh: "Your full name",
    role: "Outlet / PR agency (optional)",
    rolePh: "e.g. Época Magazine, Stampa Comunicação…",
    email: "Reply e-mail",
    emailPh: "you@outlet.com",
    phone: "Phone (optional)",
    phonePh: "+1 555 000 0000",
    message: "Pitch text",
    messagePh: "Describe the angle, the people involved, the date, what is already done and what needs to be produced…",
    attachments: "Photos and PDFs (optional)",
    attachmentsHint: "Drop the files or click to select. Photos (JPG, PNG, WEBP) and PDF documents, up to 15 MB per file.",
    choose: "Select files",
    sending: "Sending pitch…",
    submit: "Submit story pitch",
    sent: "Pitch sent! Our newsroom received your proposal and will reply within 2 business days.",
    sendAnother: "Send another pitch",
    required: "required field",
    remove: "remove",
    photo: "photo",
    doc: "pdf",
    privacy: "By submitting you agree that YOUR Magazine may contact you about this editorial proposal.",
  },
  es: {
    kicker: "Abierto a periodistas, asesores y lectores",
    title: "Envía tu sugerencia de tema",
    intro: "¿Tienes una historia, un cliente, un lanzamiento o un bastidor que merezca cobertura? Completa el formulario. Nuestra redacción evalúa todas las propuestas y se pone en contacto cuando hay encaje editorial.",
    name: "Nombre del tema",
    namePh: "Ej.: La nueva generación de vinos brasileños conquista París",
    client: "Cliente / Marca (opcional)",
    clientPh: "Ej.: Nino Cucina, Belmond, Maserati…",
    journalist: "Nombre del periodista o asesor",
    journalistPh: "Tu nombre completo",
    role: "Medio / Asesoría (opcional)",
    rolePh: "Ej.: Revista Época, Stampa Comunicação…",
    email: "Correo de respuesta",
    emailPh: "tu@medio.com",
    phone: "Teléfono (opcional)",
    phonePh: "+55 11 99999-9999",
    message: "Texto del tema",
    messagePh: "Describe el gancho, los personajes, la fecha, lo que ya está hecho y lo que hay que producir…",
    attachments: "Fotos y PDFs (opcional)",
    attachmentsHint: "Arrastra los archivos o haz clic para seleccionar. Fotos (JPG, PNG, WEBP) y documentos PDF, hasta 15 MB por archivo.",
    choose: "Seleccionar archivos",
    sending: "Enviando tema…",
    submit: "Enviar sugerencia de tema",
    sent: "¡Tema enviado! Nuestra redacción recibió tu propuesta y responderá en 2 días hábiles.",
    sendAnother: "Enviar otro tema",
    required: "campo obligatorio",
    remove: "quitar",
    photo: "foto",
    doc: "pdf",
    privacy: "Al enviar aceptas que YOUR Magazine se ponga en contacto contigo sobre esta propuesta editorial.",
  },
};

export function PitchPanel({ lang, email }: { lang: string; email: string }) {
  const c = COPY[lang] || COPY.pt;
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [files, setFiles] = useState<Uploaded[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [form, setForm] = useState({
    name: "", client: "", journalist: "", role: "", email: "", phone: "", message: "",
  });
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const invalid = (k: keyof typeof form) => touched[k] && !form[k].trim();

  const uploadFiles = useCallback(async (list: FileList | File[]) => {
    const arr = Array.from(list);
    if (!arr.length) return;
    setBusy(true);
    setErrorMsg("");
    try {
      const fd = new FormData();
      arr.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean; photos?: string[]; docs?: string[]; skipped?: string[]; error?: string;
      };
      if (!res.ok || data.error) {
        setErrorMsg(data.error || "Falha no upload dos anexos.");
      } else {
        setFiles((prev) => [
          ...prev,
          ...(data.photos || []).map((url, i) => ({ url, name: arr[i]?.name || "foto.jpg", kind: "photo" as const })),
          ...(data.docs || []).map((url, i) => ({ url, name: arr[i]?.name || "documento.pdf", kind: "doc" as const })),
        ]);
        if (data.skipped?.length) setErrorMsg(`Ignorados: ${data.skipped.join(", ")}`);
      }
    } catch {
      setErrorMsg("Falha de conexão no upload.");
    } finally {
      setBusy(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) uploadFiles(e.dataTransfer.files);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, journalist: true, message: true, email: true });
    if (!form.name.trim() || !form.journalist.trim() || form.message.trim().length < 20) return;
    if (form.email && !/.+@.+\..+/.test(form.email)) return;

    setBusy(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/pitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          lang,
          photos: files.filter((f) => f.kind === "photo").map((f) => f.url),
          docs: files.filter((f) => f.kind === "doc").map((f) => f.url),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || data.error) {
        setStatus("error");
        setErrorMsg(data.error || "Não foi possível enviar agora.");
      } else {
        setStatus("sent");
        setForm({ name: "", client: "", journalist: "", role: "", email: "", phone: "", message: "" });
        setFiles([]);
        setTouched({});
      }
    } catch {
      setStatus("error");
      setErrorMsg("Falha de conexão. Tente novamente.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="section" id="enviar-pauta">
      <div className="sh">
        <div>
          <p className="eyebrow mb-2">{c.kicker}</p>
          <h2>{c.title}</h2>
        </div>
        <a className="more" href={`mailto:${email}`}>{email}</a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
        {/* FORM */}
        <form onSubmit={submit} className="rounded-3xl border border-line bg-surface p-6 sm:p-8">
          <p className="mb-6 max-w-[62ch] text-mute">{c.intro}</p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <span className="label">{c.name} *</span>
              <input
                className={`field ${invalid("name") ? "border-red-400" : ""}`}
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, name: true }))}
                placeholder={c.namePh}
              />
              {invalid("name") && <p className="mt-1 text-xs text-red-400">{c.required}</p>}
            </div>

            <div>
              <span className="label">{c.client}</span>
              <input className="field" value={form.client} onChange={(e) => set("client", e.target.value)} placeholder={c.clientPh} />
            </div>

            <div>
              <span className="label">{c.journalist} *</span>
              <input
                className={`field ${invalid("journalist") ? "border-red-400" : ""}`}
                value={form.journalist}
                onChange={(e) => set("journalist", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, journalist: true }))}
                placeholder={c.journalistPh}
              />
              {invalid("journalist") && <p className="mt-1 text-xs text-red-400">{c.required}</p>}
            </div>

            <div>
              <span className="label">{c.role}</span>
              <input className="field" value={form.role} onChange={(e) => set("role", e.target.value)} placeholder={c.rolePh} />
            </div>

            <div>
              <span className="label">{c.email}</span>
              <input
                type="email"
                className={`field ${invalid("email") ? "border-red-400" : ""}`}
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                placeholder={c.emailPh}
              />
            </div>

            <div className="sm:col-span-2">
              <span className="label">{c.phone}</span>
              <input className="field" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder={c.phonePh} />
            </div>

            <div className="sm:col-span-2">
              <span className="label">{c.message} *</span>
              <textarea
                className={`field min-h-[160px] ${invalid("message") ? "border-red-400" : ""}`}
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, message: true }))}
                placeholder={c.messagePh}
              />
              {invalid("message") && <p className="mt-1 text-xs text-red-400">{c.required} · mínimo 20 caracteres</p>}
            </div>
          </div>

          {/* ATTACHMENTS */}
          <div className="mt-6">
            <span className="label">{c.attachments}</span>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current?.click()}
              className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition ${
                dragging ? "border-blush bg-blush/10" : "border-line bg-ink/40 hover:border-blush/60"
              }`}
            >
              <p className="font-display text-xl font-bold uppercase text-blush">
                {busy ? "…" : "＋"} {c.choose}
              </p>
              <p className="mx-auto mt-2 max-w-[52ch] text-xs text-mute">{c.attachmentsHint}</p>
              <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) uploadFiles(e.target.files);
                  e.target.value = "";
                }}
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {files.map((f, i) => (
                  <div key={`${f.url}-${i}`} className="flex items-center gap-2 rounded-xl border border-line bg-ink/50 p-2 pr-3">
                    {f.kind === "photo" ? (
                      <img src={f.url} alt="" className="h-11 w-14 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-11 w-14 place-items-center rounded-lg bg-wine font-display text-[10px] text-blush">PDF</span>
                    )}
                    <div className="min-w-0 max-w-[180px]">
                      <p className="truncate text-xs">{f.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-mute">{f.kind === "photo" ? c.photo : c.doc}</p>
                    </div>
                    <button
                      type="button"
                      className="chip !px-2 !py-0.5 text-[10px]"
                      onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={c.remove}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errorMsg && <p className="mt-2 text-xs text-red-400">{errorMsg}</p>}
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button type="submit" className="btn btn-pri" disabled={busy}>
              {busy ? c.sending : c.submit}
            </button>
            <p className="max-w-[38ch] text-xs text-mute">{c.privacy}</p>
          </div>

          {status === "sent" && (
            <div className="mt-5 rounded-2xl border border-blush/50 bg-blush/10 p-5">
              <p className="font-display text-xl font-bold uppercase text-blush">{c.sent}</p>
              <button
                type="button"
                className="btn mt-3"
                onClick={() => { setStatus("idle"); setErrorMsg(""); }}
              >
                {c.sendAnother}
              </button>
            </div>
          )}
        </form>

        {/* GUIDE */}
        <aside className="grid content-start gap-5">
          <div className="rounded-3xl border border-line bg-wine p-6 sm:p-7">
            <p className="eyebrow mb-2">Como avaliamos</p>
            <h3 className="font-display text-2xl font-bold uppercase">O que faz uma boa pauta</h3>
            <ul className="mt-4 grid gap-3 text-sm">
              {[
                "Gancho atual e data — por que agora?",
                "Personagens disponíveis para entrevista",
                "Materiais de apoio (release, fotos, dados)",
                "Ângulo editorial original, fora do óbvio",
                "Prazo realista para produção",
              ].map((item, i) => (
                <li key={i} className="flex gap-3 rounded-xl border border-line bg-surface p-3">
                  <span className="font-display text-base font-bold text-gold">0{i + 1}</span>
                  <span className="text-mute">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl border border-line bg-surface p-6">
            <p className="eyebrow mb-2">Fluxo editorial</p>
            <div className="grid gap-3 text-sm">
              {[
                ["Envio", "Você preenche o formulário e anexa fotos e PDFs."],
                ["Triagem", "A redação avalia em até 2 dias úteis."],
                ["Retorno", "Respondemos por e-mail com o encaixe editorial."],
                ["Produção", "Se aprovada, entra na pauta com data e equipe."],
              ].map(([t, d]) => (
                <div key={t} className="flex gap-3">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blush" />
                  <div>
                    <b className="font-display text-base uppercase">{t}</b>
                    <p className="text-mute">{d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
