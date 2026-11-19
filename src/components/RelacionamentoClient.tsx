"use client";

import { useState } from "react";

const RATINGS = ["Ruim", "Justo", "Bom", "Muito bom", "Excelente"] as const;

export function RelacionamentoClient({ lang, email }: { lang: string; email: string }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [code, setCode] = useState("+55");
  const [tel, setTel] = useState("");
  const [dept, setDept] = useState("Relacionamento / Opinião");
  const [rating, setRating] = useState<string>("Excelente");
  const [message, setMessage] = useState("");
  const [improve, setImprove] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail.trim()) return;
    setStatus("sending");
    const fullName = `${firstName} ${lastName}`.trim();
    const res = await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: fullName,
        email: userEmail.trim(),
        brand: `${dept} · Avaliação: ${rating} · Tel: ${code} ${tel}`,
        lang,
        plan: [dept, `Avaliação: ${rating}`, message.slice(0, 180), improve ? `Melhoria: ${improve.slice(0, 140)}` : ""].filter(Boolean),
        total: 0,
        reach: 0,
      }),
    });
    setStatus(res.ok ? "sent" : "error");
    if (res.ok) {
      setFirstName("");
      setLastName("");
      setMessage("");
      setImprove("");
    }
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr]">
      <form onSubmit={submit} className="rounded-3xl border border-line bg-surface p-6 sm:p-10">
        <p className="eyebrow mb-2">Entre em Contato</p>
        <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">
          Queremos saber sua opinião
        </h2>
        <p className="mt-1 mb-6 text-sm text-mute">
          Dúvidas, sugestões, elogios, pautas editoriais e parcerias comerciais.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="label">Nome</span>
            <input className="field" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Seu nome" required />
          </label>
          <label className="block">
            <span className="label">Sobrenome</span>
            <input className="field" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Seu sobrenome" />
          </label>
          <label className="block">
            <span className="label">E-mail *</span>
            <input className="field" type="email" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="voce@exemplo.com" required />
          </label>
          <label className="block">
            <span className="label">Departamento</span>
            <select className="field" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="Relacionamento / Opinião">Relacionamento / Opinião</option>
              <option value="Redação & Pautas">Redação & Pautas</option>
              <option value="Comercial & Mídia Kit">Comercial & Mídia Kit</option>
              <option value="Assessoria / Sala de Imprensa">Assessoria / Sala de Imprensa</option>
              <option value="Luxury Hotels & Fine Dining">Luxury Hotels & Fine Dining</option>
            </select>
          </label>
          <div className="grid grid-cols-[95px_1fr] gap-2 sm:col-span-2">
            <label className="block">
              <span className="label">Código</span>
              <input className="field" value={code} onChange={(e) => setCode(e.target.value)} placeholder="+55" />
            </label>
            <label className="block">
              <span className="label">Telefone</span>
              <input className="field" value={tel} onChange={(e) => setTel(e.target.value)} placeholder="(11) 99999-9999" />
            </label>
          </div>
        </div>

        <div className="mt-5">
          <span className="label">Avalie nossos serviços</span>
          <div className="flex flex-wrap gap-2">
            {RATINGS.map((r) => (
              <button
                key={r}
                type="button"
                className="chip"
                data-on={rating === r}
                onClick={() => setRating(r)}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="block">
            <span className="label">Escreva sua mensagem</span>
            <textarea
              className="field min-h-[110px]"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Conte para nós sua dúvida, sugestão, elogio ou proposta…"
              required
            />
          </label>
          <label className="block">
            <span className="label">Como podemos melhorar?</span>
            <textarea
              className="field min-h-[80px]"
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
              placeholder="Opcional — sua sugestão nos ajuda a evoluir a revista."
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="submit" className="btn btn-pri" disabled={status === "sending" || !userEmail.trim()}>
            {status === "sending" ? "Enviando…" : "Enviar feedback"}
          </button>
          {status === "sent" && (
            <span className="font-semibold text-blush">Obrigado por sua mensagem! Nossa equipe recebeu seu contato.</span>
          )}
          {status === "error" && (
            <span className="text-sm text-red-400">Não foi possível enviar agora. Verifique o e-mail digitado.</span>
          )}
        </div>
      </form>

      <aside className="grid content-start gap-5">
        <div className="rounded-3xl border border-line bg-wine p-6 sm:p-8">
          <p className="eyebrow mb-2">Canais Diretos</p>
          <h3 className="font-display text-3xl font-extrabold uppercase">Fale com a Redação & Diretoria</h3>
          <p className="mt-2 text-sm text-mute">
            Atendimento direto para leitores, marcas parceiras, assessores de imprensa e convidados.
          </p>

          <div className="mt-6 grid gap-4">
            <div className="rounded-2xl border border-line bg-surface p-4">
              <span className="label">E-mail Oficial</span>
              <a href={`mailto:${email}`} className="break-all font-display text-xl font-bold text-blush hover:underline">
                {email}
              </a>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <span className="label">Instagram Oficial</span>
              <a
                href="https://instagram.com/yourmag.nyc"
                target="_blank"
                rel="noreferrer"
                className="font-display text-xl font-bold uppercase hover:text-blush"
              >
                @yourmag.nyc ↗
              </a>
            </div>
            <div className="rounded-2xl border border-line bg-surface p-4">
              <span className="label">Edições Online</span>
              <a
                href="https://edicoesyour.online"
                target="_blank"
                rel="noreferrer"
                className="font-display text-xl font-bold uppercase hover:text-blush"
              >
                edicoesyour.online ↗
              </a>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
