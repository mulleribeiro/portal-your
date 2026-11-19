"use client";

import { useState } from "react";
import { EditableImage } from "./EditableImage";

type Pillar = {
  id: string;
  tag: string;
  title: string;
  summary: string;
  bullets: string[];
};

export function FounderClient({
  lang,
  portraitUrl,
  collageUrl,
  signatureUrl,
  email,
}: {
  lang: string;
  portraitUrl: string;
  collageUrl: string;
  signatureUrl: string;
  email: string;
}) {
  const [activeTab, setActiveTab] = useState<string>("visao");

  const pillars: Pillar[] =
    lang === "en"
      ? [
          {
            id: "visao",
            tag: "01 · Global Leadership",
            title: "20 Years in International Luxury, Fashion & Media",
            summary:
              "As CEO and International President of YOUR Magazine, Müller Ribeiro leads global operations connecting major fashion capitals to high-end hospitality destinations from his independent office.",
            bullets: [
              "Founder & Editor-in-Chief of YOUR Magazine ( celebrating 10 years, 88 published issues and 13.2M monthly views )",
              "International talent and scouting experience with agencies such as Marilyn NY, Women Paris and Next Milan",
              "Remote executive leadership with impact across Brazil, the United States, Europe and Latin America",
            ],
          },
          {
            id: "neuro",
            tag: "02 · Cognitive Edge",
            title: "Neurodiversity & Creative Engineering",
            summary:
              "Diagnosed with ASD (Level 1), ADHD and Giftedness/High Abilities, Müller turns a singular cognitive profile into a strategic edge for editorial engineering and trend forecasting.",
            bullets: [
              "Editorial hyperfocus applied to systemic reading of the luxury and lifestyle market",
              "Anticipation of aesthetic and behavioral shifts before they reach the mainstream",
              "Creative engineering applied to complex brand positioning and communication challenges",
            ],
          },
          {
            id: "formacao",
            tag: "03 · Academic Excellence",
            title: "Communications, Advertising & Executive Specializations",
            summary:
              "A background in Social Communication, Advertising & Marketing combined with international specializations at world-leading institutions.",
            bullets: [
              "Degree in Social Communication — Advertising & Propaganda",
              "Specializations at Harvard, MIT and UC Berkeley",
              "Formal training in photography, visual production and art direction",
            ],
          },
          {
            id: "atuacao",
            tag: "04 · Multidisciplinary Practice",
            title: "6 Fronts of Creative & Executive Direction",
            summary:
              "An integrated practice uniting editorial curation, art direction, luxury hospitality and strategic PR.",
            bullets: [
              "Creative Direction & Editorial Curation for international luxury publications",
              "Luxury Hospitality & Fine Dining Curation connecting premier hotel chains",
              "Integrated Communication & PR Strategy for prestige brands and public figures",
            ],
          },
        ]
      : lang === "es"
      ? [
          {
            id: "visao",
            tag: "01 · Liderazgo Global",
            title: "20 Años en Lujo, Moda y Medios Internacionales",
            summary:
              "Como CEO y Presidente Internacional de YOUR Magazine, Müller Ribeiro lidera operaciones globales que conectan las principales capitales de la moda con destinos de hospitalidad de alto nivel.",
            bullets: [
              "Fundador y Editor en Jefe de YOUR Magazine (10 años, 88 ediciones y 13,2 millones de visualizaciones mensuales)",
              "Experiencia internacional con agencias como Marilyn NY, Women Paris y Next Milan",
              "Gestión ejecutiva global conectando Brasil, Estados Unidos, Europa y América Latina",
            ],
          },
          {
            id: "neuro",
            tag: "02 · Diferencial Cognitivo",
            title: "Neurodiversidad e Ingeniería Creativa",
            summary:
              "Diagnosticado con TEA (Nivel 1), TDAH y Altas Capacidades/Superdotación, transforma un funcionamiento cognitivo singular en ventaja competitiva.",
            bullets: [
              "Hiperfoco editorial aplicado a la lectura sistémica del mercado premium",
              "Anticipación de tendencias estéticas y de comportamento",
              "Ingeniería creativa aplicada a la resolución de problemas complejos de posicionamiento",
            ],
          },
          {
            id: "formacao",
            tag: "03 · Excelencia Académica",
            title: "Comunicación, Publicidad y Especializaciones",
            summary:
              "Formación como comunicólogo y publicista sumada a especializaciones en instituciones líderes a nivel mundial.",
            bullets: [
              "Comunicación Social, Publicidad y Propaganda",
              "Especializaciones en Harvard, MIT y UC Berkeley",
              "Formación en fotografía, diseño y dirección de arte",
            ],
          },
          {
            id: "atuacao",
            tag: "04 · Actuación Multidisciplinaria",
            title: "6 Frentes de Dirección Creativa y Ejecutiva",
            summary:
              "Una actuación que integra curaduría editorial, dirección de arte, hospitalidad de lujo y relaciones públicas.",
            bullets: [
              "Dirección Creativa y Curaduría Editorial con estándar internacional",
              "Curaduría de Turismo y Hospitalidad Premium (Luxury Hotels & Fine Dining)",
              "Estrategias de Comunicación Integrada y PR para marcas de lujo",
            ],
          },
        ]
      : [
          {
            id: "visao",
            tag: "01 · Liderança Global",
            title: "20 Anos nos Mercados de Luxo, Moda e Mídia Internacional",
            summary:
              "Como CEO e Presidente Internacional, Müller Ribeiro lidera operações globais que conectam as principais capitais da moda a destinos de hospitalidade de alto padrão, comandando integralmente a YOUR Magazine a partir de seu escritório independente.",
            bullets: [
              "Fundador e Editor-Chefe da YOUR Magazine (10 anos de história, 88 edições e 13,2 mi de visualizações/mês)",
              "Curadoria de talentos com experiência em agências internacionais como Marilyn NY, Women Paris e Next Milan",
              "Operação independente com presença no Brasil e nos Estados Unidos, de Nova York a Fernando de Noronha",
            ],
          },
          {
            id: "neuro",
            tag: "02 · Diferencial Cognitivo",
            title: "Neurodiversidade & Engenharia Criativa",
            summary:
              "Diagnosticado com TEA (Nível 1), TDAH e Altas Habilidades/Superdotação, Müller converte um funcionamento cognitivo singular em diferencial estratégico de alta precisão.",
            bullets: [
              "Antecipação de tendências estéticas e comportamentais fruto de hiperfoco editorial e leitura sistêmica",
              "Engenharia criativa aplicada à resolução de problemas complexos de posicionamento e mídia",
              "Transformação de processos editoriais em experiências digitais imersivas",
            ],
          },
          {
            id: "formacao",
            tag: "03 · Excelência Intelectual",
            title: "Comunicação Social & Especializações Internacionais",
            summary:
              "Sua formação como comunicólogo e publicitário, somada a especializações em algumas das universidades mais prestigiadas do mundo, reflete um compromisso inabalável com a excelência intelectual.",
            bullets: [
              "Graduação em Comunicação Social — Publicidade & Propaganda",
              "Especializações em Harvard, MIT e UC Berkeley",
              "Formação técnica e artística em Fotografia, Design e Direção de Arte",
            ],
          },
          {
            id: "atuacao",
            tag: "04 · Atuação Multidisciplinar",
            title: "6 Frentes de Direção Executiva e Criativa",
            summary:
              "Mais de duas décadas integrando direção criativa, curadoria hoteleira, fotografia e estratégia de comunicação.",
            bullets: [
              "Direção Criativa & Curadoria Editorial para publicações e projetos de luxo",
              "Hospitalidade Premium & Turismo: conexão com as melhores redes hoteleiras e restaurantes do mundo",
              "Estratégia de Comunicação Integrada, PR e gestão de equipes criativas internacionais",
            ],
          },
        ];

  const active = pillars.find((p) => p.id === activeTab) || pillars[0];

  const areas = [
    {
      num: "01",
      title: "Direção Editorial",
      desc: "Curadoria de conteúdo para publicações de luxo com padrão internacional e hiperfoco editorial.",
    },
    {
      num: "02",
      title: "Operações Globais",
      desc: "Liderança conectando capitais da moda a destinos de hospitalidade de alto padrão, com impacto mundial.",
    },
    {
      num: "03",
      title: "Direção de Arte & Foto",
      desc: "Olhar estético apurado para campanhas, capas, editoriais e produções visuais de alto nível.",
    },
    {
      num: "04",
      title: "Hospitalidade Premium",
      desc: "Curadoria de destinos exclusivos (Luxury Hotels & Fine Dining) junto às melhores redes do mundo.",
    },
    {
      num: "05",
      title: "Estratégia & PR",
      desc: "Comunicação integrada e construção de autoridade para marcas de luxo e personalidades.",
    },
    {
      num: "06",
      title: "Curadoria de Talentos",
      desc: "Formação e gestão de equipes criativas com passagem por Marilyn NY, Women Paris e Next Milan.",
    },
  ];

  return (
    <div className="grid gap-12 font-sans">
      {/* HERO SPLIT */}
      <section className="grid gap-8 rounded-3xl border border-line bg-surface p-6 sm:p-10 lg:grid-cols-[.88fr_1.12fr] lg:items-center">
        <div className="relative mx-auto w-full max-w-[440px]">
          <div className="md r34 overflow-hidden rounded-2xl border border-line shadow-2xl">
            <EditableImage
              target={{ entity: "settings", id: "portal", field: "images.founderPortrait.url", label: "Foto Retrato d'O Fundador" }}
              src={portraitUrl}
              alt="Müller Ribeiro"
            />
          </div>
          <div className="mt-3 flex items-center justify-between rounded-xl border border-line bg-ink/70 px-4 py-2.5">
            <div>
              <span className="block font-display text-xs uppercase tracking-[.22em] text-gold">Fundador & CEO</span>
              <strong className="font-display text-lg uppercase">YOUR Magazine · NYC & Brasil</strong>
            </div>
            {signatureUrl && (
              <img src={signatureUrl} alt="Assinatura Müller Ribeiro" className="h-9 w-auto opacity-85 invert" />
            )}
          </div>
        </div>

        <div className="flex flex-col justify-between gap-6">
          <div>
            <div className="flex flex-wrap gap-2">
              <span className="chip" data-on="true">CEO & Editor-Chefe</span>
              <span className="chip">Comunicólogo</span>
              <span className="chip">Harvard · MIT · UC Berkeley</span>
            </div>

            <h1 className="mt-4 font-display text-[clamp(44px,7vw,86px)] font-extrabold uppercase leading-[.95]">
              Müller Ribeiro
            </h1>

            <p className="mt-4 text-lg font-medium leading-relaxed text-paper">
              Liderança criativa que integra visão global, engenharia editorial e neurodiversidade como diferencial estratégico no mercado internacional de luxo.
            </p>

            <p className="mt-3 text-base leading-relaxed text-mute">
              Com 20 anos de atuação consolidada nos mercados de luxo, moda e mídia internacional, Müller Ribeiro construiu uma carreira pautada pela resiliência e pela inovação. Sua trajetória não é apenas sobre resultados — é sobre a forma singular de processar o mundo.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 rounded-2xl border border-line bg-ink/40 p-5 sm:grid-cols-4">
            <div className="stat"><b>20+</b><span>anos de carreira</span></div>
            <div className="stat"><b>10</b><span>anos de YOUR</span></div>
            <div className="stat"><b>88</b><span>edições dirigidas</span></div>
            <div className="stat"><b>13,2 mi</b><span>views / mês</span></div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a href={`mailto:${email}`} className="btn btn-gold">
              {email}
            </a>
            <a href="/pt/press" className="btn">
              Sala de Imprensa
            </a>
          </div>
        </div>
      </section>

      {/* INTERACTIVE PILLARS EXPLORER */}
      <section className="rounded-3xl border border-line bg-wine p-6 sm:p-10">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow mb-2">Trajetória & Metodologia</p>
            <h2 className="font-display text-3xl font-extrabold uppercase sm:text-4xl">
              Visão Global & Engenharia Criativa
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {pillars.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip"
                data-on={activeTab === p.id}
                onClick={() => setActiveTab(p.id)}
              >
                {p.tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-6 rounded-2xl border border-line bg-surface p-6 sm:p-8 lg:grid-cols-[1.1fr_.9fr]">
          <div>
            <span className="tag">{active.tag}</span>
            <h3 className="mt-2 font-display text-3xl font-extrabold uppercase">{active.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-mute">{active.summary}</p>
          </div>
          <ul className="grid content-center gap-3">
            {active.bullets.map((b, i) => (
              <li key={i} className="flex items-start gap-3 rounded-xl border border-line bg-ink/50 p-3.5 text-sm">
                <span className="mt-0.5 font-display text-base font-bold text-gold">0{i + 1}</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CAREER MOSAIC COLLAGE */}
      <section className="grid gap-6">
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Bastidores, Passarelas e Produções</p>
            <h2>Duas Décadas de Mercado Internacional</h2>
          </div>
        </div>
        <div className="founder-collage overflow-hidden rounded-3xl border border-line bg-surface">
          <EditableImage
            target={{ entity: "settings", id: "portal", field: "images.founderCollage.url", label: "Mosaico de Carreira" }}
            src={collageUrl}
            alt="Trajetória de Müller Ribeiro"
            imgClass="block w-full h-auto object-contain"
          />
        </div>
      </section>

      {/* 6 MULTIDISCIPLINARY AREAS */}
      <section>
        <div className="sh">
          <div>
            <p className="eyebrow mb-2">Especialidades</p>
            <h2>Frentes de Atuação</h2>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((a) => (
            <div
              key={a.num}
              className="rounded-2xl border border-line bg-surface p-6 transition hover:-translate-y-1 hover:border-blush"
            >
              <span className="font-display text-3xl font-extrabold text-gold">{a.num}</span>
              <h3 className="mt-2 font-display text-2xl font-bold uppercase">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
