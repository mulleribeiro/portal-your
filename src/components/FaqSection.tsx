"use client";

import { useMemo, useState } from "react";

type FaqItem = {
  n: string;
  q: string;
  answer: string | React.ReactNode;
  extra?: React.ReactNode;
};

export function FaqSection({ lang, email }: { lang: string; email: string }) {
  const [open, setOpen] = useState<string | null>("01");
  const [query, setQuery] = useState("");

  const items = useMemo<FaqItem[]>(() => {
    const L = lang;

    const officeNY = "1740 Broadway, 15th Floor, New York, 10019, EUA";
    const officeBR = "R. João da Silva Araújo, 8 — Sala 306, Centro, Caratinga, MG, 35300-238";

    if (L === "en") {
      return [
        {
          n: "01",
          q: "How can I send story pitches to YOUR Magazine?",
          answer: (
            <>
              To send story pitches, please fill in the form in our{" "}
              <a className="font-semibold text-blush underline" href="/en/press#enviar-pauta">Press Room</a>.
              You can also e-mail <a className="font-semibold text-blush underline" href={`mailto:${email}`}>{email}</a>.
            </>
          ),
        },
        {
          n: "02",
          q: "Which sections and segments does YOUR cover?",
          answer:
            "OUR editorial scope covers Fashion, Luxury, Health, Tourism, Gastronomy, Technology and Business — plus covers with exclusive interviews, interactive issues, the YOUR Play streaming platform and the Luxury Hotels and Fine Dining collections.",
        },
        {
          n: "03",
          q: "Is YOUR Magazine Brazilian or American?",
          answer: (
            <>
              YOUR Magazine is <b>Brazilian</b>, but we have offices in both Brazil and the United States.
            </>
          ),
        },
        {
          n: "04",
          q: "Where are YOUR Magazine's offices?",
          answer: (
            <>
              <p className="mb-2"><b className="text-paper">New York City office:</b><br />{officeNY}</p>
              <p><b className="text-paper">Brazil office:</b><br />{officeBR}</p>
            </>
          ),
        },
        {
          n: "05",
          q: "Where can I send products from the brand I represent?",
          answer: (
            <>
              <p className="mb-2">You can send products to our office in Brazil:</p>
              <p className="mb-3"><b className="text-paper">{officeBR}</b></p>
              <p className="italic text-mute">
                <b className="not-italic text-paper">Note:</b> if you ship via the postal service, please notify us by e-mail
                (<a className="underline" href={`mailto:${email}`}>{email}</a>) and include the tracking code.
              </p>
            </>
          ),
        },
        {
          n: "06",
          q: "How can I get more information about joining or placing my brand in the magazine?",
          answer: (
            <>
              You can download our <b>media kit</b> for more information. After downloading it, contact us at{" "}
              <a className="font-semibold text-blush underline" href={`mailto:${email}`}>{email}</a>.
            </>
          ),
          extra: "mediakit",
        },
        {
          n: "07",
          q: "I still have questions, suggestions or praise. How can I get in touch?",
          answer:
            "If you still have questions, suggestions or praise, please fill in the form on our website and we will get back to you as soon as possible.",
          extra: "form",
        },
        {
          n: "08",
          q: "What is YOUR Play?",
          answer:
            "YOUR Play is YOUR Magazine's streaming platform: original series, exclusive interviews, behind-the-scenes and specials — the magazine's video arm, available in Portuguese, English and Spanish.",
          extra: "play",
        },
      ];
    }

    if (L === "es") {
      return [
        {
          n: "01",
          q: "¿Cómo puedo enviar sugerencias de temas a la revista YOUR?",
          answer: (
            <>
              Para enviar sugerencias de temas, por favor completa el formulario en nuestra{" "}
              <a className="font-semibold text-blush underline" href="/es/press#enviar-pauta">Sala de Prensa</a>.
              También puedes escribir a <a className="font-semibold text-blush underline" href={`mailto:${email}`}>{email}</a>.
            </>
          ),
        },
        {
          n: "02",
          q: "¿Cuáles son las secciones y segmentos de YOUR?",
          answer:
            "Nuestro alcance editorial cubre Moda, Lujo, Salud, Turismo, Gastronomía, Tecnología y Negocios — además de portadas con entrevistas exclusivas, ediciones interactivas, el streaming YOUR Play y las colecciones Luxury Hotels y Fine Dining.",
        },
        {
          n: "03",
          q: "¿La revista YOUR es brasileña o americana?",
          answer: (
            <>
              La revista YOUR es <b>brasileña</b>, pero tenemos oficinas tanto en Brasil como en Estados Unidos.
            </>
          ),
        },
        {
          n: "04",
          q: "¿Dónde están las oficinas de la revista YOUR?",
          answer: (
            <>
              <p className="mb-2"><b className="text-paper">Oficina en Nueva York:</b><br />{officeNY}</p>
              <p><b className="text-paper">Oficina en Brasil:</b><br />{officeBR}</p>
            </>
          ),
        },
        {
          n: "05",
          q: "¿A qué dirección puedo enviar productos de la marca que represento?",
          answer: (
            <>
              <p className="mb-2">Puedes enviar productos a nuestra oficina en Brasil:</p>
              <p className="mb-3"><b className="text-paper">{officeBR}</b></p>
              <p className="italic text-mute">
                <b className="not-italic text-paper">Observación:</b> si envías por correo postal, por favor avísanos por correo
                (<a className="underline" href={`mailto:${email}`}>{email}</a>) e incluye el código de rastreo.
              </p>
            </>
          ),
        },
        {
          n: "06",
          q: "¿Cómo puedo obtener más información sobre cómo participar o colocar mi marca en la revista?",
          answer: (
            <>
              Puedes descargar nuestro <b>media kit</b> para más información. Tras descargarlo, contáctanos en{" "}
              <a className="font-semibold text-blush underline" href={`mailto:${email}`}>{email}</a>.
            </>
          ),
          extra: "mediakit",
        },
        {
          n: "07",
          q: "Aún tengo dudas, sugerencias o elogios. ¿Cómo puedo contactar?",
          answer:
            "Si aún tienes dudas, sugerencias o elogios, por favor completa el formulario en nuestro sitio y responderemos lo antes posible.",
          extra: "form",
        },
        {
          n: "08",
          q: "¿Qué es YOUR Play?",
          answer:
            "YOUR Play es la plataforma de streaming de YOUR Magazine: series originales, entrevistas exclusivas, bastidores y especiales — el brazo audiovisual de la revista, disponible en español, portugués e inglés.",
          extra: "play",
        },
      ];
    }

    // pt
    return [
      {
        n: "01",
        q: "Como faço para enviar sugestões de pautas para a revista YOUR?",
        answer: (
          <>
            Para enviar sugestões de pautas, por favor preencha o formulário na nossa{" "}
            <a className="font-semibold text-blush underline" href="/pt/press#enviar-pauta">Sala de Imprensa</a>.
            Você também pode enviar um e-mail para{" "}
            <a className="font-semibold text-blush underline" href={`mailto:${email}`}>{email}</a>.
          </>
        ),
      },
      {
        n: "02",
        q: "Quais são as editorias e segmentos da YOUR Magazine?",
        answer:
          "Nosso alcance editorial cobre Moda, Luxo, Saúde, Turismo, Gastronomia, Tecnologia e Negócios — além de capas com entrevistas exclusivas, edições interativas, a plataforma de streaming YOUR Play e as coleções Luxury Hotels e Fine Dining.",
      },
      {
        n: "03",
        q: "A revista YOUR é brasileira ou americana?",
        answer: (
          <>
            A revista YOUR é <b>brasileira</b>, mas temos endereços tanto no Brasil quanto nos Estados Unidos.
          </>
        ),
      },
      {
        n: "04",
        q: "Onde ficam os escritórios da revista YOUR?",
        answer: (
          <>
            <p className="mb-2"><b className="text-paper">Escritório em Nova York City:</b><br />{officeNY}</p>
            <p><b className="text-paper">Escritório no Brasil:</b><br />{officeBR}</p>
          </>
        ),
      },
      {
        n: "05",
        q: "Para qual endereço posso enviar produtos da marca que represento?",
        answer: (
          <>
            <p className="mb-2">Você pode enviar produtos para o nosso escritório no Brasil:</p>
            <p className="mb-3"><b className="text-paper">{officeBR}</b></p>
            <p className="italic text-mute">
              <b className="not-italic text-paper">Observação:</b> se for enviar via Correios, por favor, nos notifique por e-mail
              (<a className="underline" href={`mailto:${email}`}>{email}</a>) e inclua o código de rastreio.
            </p>
          </>
        ),
      },
      {
        n: "06",
        q: "Como posso obter mais informações sobre como participar ou colocar minha marca na revista?",
        answer: (
          <>
            Você pode baixar nosso <b>mídia kit</b> para mais informações. Após baixar o mídia kit, entre em contato conosco pelo
            e-mail <a className="font-semibold text-blush underline" href={`mailto:${email}`}>{email}</a>.
          </>
        ),
        extra: "mediakit",
      },
      {
        n: "07",
        q: "Ainda tenho dúvidas, sugestões ou elogios. Como posso entrar em contato?",
        answer:
          "Se você ainda tiver dúvidas, sugestões ou elogios, por favor, preencha o formulário em nosso site e responderemos o mais breve possível.",
        extra: "form",
      },
      {
        n: "08",
        q: "O que é a YOUR Play?",
        answer:
          "A YOUR Play é a plataforma de streaming da YOUR Magazine: séries originais, entrevistas exclusivas, bastidores e especiais — o braço audiovisual da revista, disponível em português, inglês e espanhol.",
        extra: "play",
      },
    ];
  }, [lang, email]);

  const filtered = query.trim()
    ? items.filter((i) => `${i.n} ${i.q}`.toLowerCase().includes(query.trim().toLowerCase()))
    : items;

  return (
    <section className="section" id="faq">
      <div className="sh">
        <div>
          <p className="eyebrow mb-2">Dúvidas frequentes</p>
          <h2>{lang === "en" ? "Frequently asked questions" : lang === "es" ? "Preguntas frecuentes" : "Perguntas frequentes"}</h2>
        </div>
        <span className="more">{items.length} perguntas</span>
      </div>

      <div className="mx-auto max-w-[820px]">
        <div className="relative mb-8">
          <input
            className="field !py-4 !text-lg"
            placeholder={lang === "en" ? "Looking for something?" : lang === "es" ? "¿Buscas algo?" : "Procurando por algo?"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar pergunta"
          />
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-mute">
            <circle cx="10.5" cy="10.5" r="6.5" /><line x1="20" y1="20" x2="15.3" y2="15.3" />
          </svg>
        </div>

        <div className="grid gap-3">
          {filtered.map((item) => {
            const isOpen = open === item.n;
            return (
              <div key={item.n} className="overflow-hidden rounded-2xl border border-line bg-surface">
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.n)}
                  aria-expanded={isOpen}
                  className="flex w-full items-start gap-4 p-5 text-left"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-wine font-display text-xl font-extrabold text-blush">
                    {item.n}
                  </span>
                  <h3 className="flex-1 font-display text-2xl font-bold uppercase leading-tight">{item.q}</h3>
                  <span className="mt-1 shrink-0 text-2xl text-mute transition" style={{ transform: isOpen ? "rotate(180deg)" : "none" }}>
                    ⌄
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-line/60 px-5 pb-5 pt-4 pl-[76px]">
                    <div className="text-[15px] leading-relaxed text-mute">{item.answer}</div>

                    {item.extra === "mediakit" && (
                      <a
                        href="/api/media-kit-pdf"
                        download
                        className="mt-4 flex max-w-[380px] items-center gap-4 rounded-2xl border border-line bg-ink/50 p-4 transition hover:border-blush"
                      >
                        <span className="grid h-14 w-11 shrink-0 place-items-center rounded-lg bg-blush font-display text-xs font-bold text-[#12060a]">PDF</span>
                        <span className="min-w-0">
                          <b className="block truncate font-display text-lg uppercase">Mídia Kit 2025 PT BR.pdf</b>
                          <small className="block text-mute">
                            {lang === "en" ? "Download PDF · media kit" : lang === "es" ? "Descargar PDF · media kit" : "Download PDF · mídia kit"}
                          </small>
                        </span>
                        <span className="ml-auto text-2xl text-blush">↓</span>
                      </a>
                    )}

                    {item.extra === "form" && (
                      <a href="#formulario-contato" className="btn btn-pri mt-4 inline-flex">
                        {lang === "en" ? "Go to the contact form" : lang === "es" ? "Ir al formulario" : "Ir para o formulário de contato"}
                      </a>
                    )}

                    {item.extra === "play" && (
                      <a href={`/${lang}/play`} className="btn btn-gold mt-4 inline-flex">
                        {lang === "en" ? "Explore YOUR Play" : lang === "es" ? "Explorar YOUR Play" : "Explorar o YOUR Play"}
                      </a>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
