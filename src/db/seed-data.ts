import type { PortalSettings } from "./schema";
import { ARTICLE_CATEGORIES } from "../lib/categories";
import { CONTACT_EMAIL } from "../lib/contact";
import ref from "./reference/reference.json";
import catalogData from "./reference/catalog.json";

/** Bump when the demo content changes: the database is refreshed automatically (uploads are kept). */
export const SEED_VERSION = 8;

export type ML = Record<string, string>;
const ml = (pt: string, en?: string, es?: string): ML => ({
  pt,
  ...(en ? { en } : {}),
  ...(es ? { es } : {}),
});

export type SeedItem = {
  id: string;
  type: string;
  title: ML;
  dek?: ML;
  body?: ML;
  category?: string;
  tags?: string[];
  image?: string;
  url?: string;
  meta?: Record<string, unknown>;
  featured?: boolean;
  position?: number;
};

export const CATEGORIES = [...ARTICLE_CATEGORIES];

const px = (id: number, w = 1200, h = 800) =>
  `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=${w}&h=${h}`;

const HOTEL_PX = [14012687, 14036251, 34940589, 34645081, 8312027, 14025910, 32699809, 32699811];
const FOOD_PX = [23644633, 1327393, 7627408, 24289165, 8194817, 5156929, 5491046, 6327536];
const ART_PX = [36126282, 2149422, 27584011, 41025124, 14482822, 13432768, 32658551, 29608796];

export const seedSettings: PortalSettings = {
  version: SEED_VERSION,
  brand: "your",
  brandSub: "",
  slogan: ml(
    "Feita no Brasil para o mundo, há 10 anos",
    "Made in Brazil for the world, for 10 years",
    "Hecha en Brasil para el mundo, hace 10 años",
  ),
  logo: "/brand/logo.png",
  heroKicker: ml("Há 10 anos", "10 years", "10 años"),
  heroTitle: ml("Bem-vindo à YOUR", "Welcome to YOUR", "Bienvenido a YOUR"),
  heroText: ml(
    "Revista, edições, capas, vídeos, coleções de hotéis e gastronomia e assessoria em um só endereço. Role e escolha por onde começar.",
    "Magazine, issues, covers, videos, hotel and dining collections and PR in a single address. Scroll and choose where to start.",
    "Revista, ediciones, portadas, vídeos, colecciones de hoteles y gastronomía y relaciones públicas en un solo lugar. Desplázate y elige por dónde empezar.",
  ),
  email: CONTACT_EMAIL,
  phone: "+55 11 95000-1000",
  address: ml("São Paulo · New York City", "São Paulo · New York City", "São Paulo · Nueva York"),
  footerText: ml(
    "© YOUR Magazine — 10 Anos. Todos os direitos reservados.",
    "© YOUR Magazine — 10 Years. All rights reserved.",
    "© YOUR Magazine — 10 Años. Todos los derechos reservados.",
  ),
  stats: [
    { value: "10", label: ml("anos de revista", "years of magazine", "años de revista") },
    { value: "88", label: ml("edições publicadas", "published issues", "ediciones publicadas") },
    { value: "300+", label: ml("capas digitais", "digital covers", "portadas digitales") },
    { value: "218", label: ml("entrevistas exclusivas", "exclusive interviews", "entrevistas exclusivas") },
    { value: "13,2 mi", label: ml("visualizações por mês", "views per month", "visualizaciones por mes") },
  ],
  audience: [
    { value: "84,7%", label: ml("mulheres", "women", "mujeres") },
    { value: "35 a 44", label: ml("41,6% do público", "41.6% of the audience", "41,6% del público") },
    { value: "25 a 34", label: ml("22,6% do público", "22.6% of the audience", "22,6% del público") },
    { value: "A e B", label: ml("classes em foco", "target classes", "clases en foco") },
    { value: "BR + EUA", label: ml("presença", "presence", "presencia") },
  ],
  genderWomen: 84.7,
  audienceBreakdown: [
    { label: ml("35 a 44 anos", "35 to 44 years", "35 a 44 años"), value: 41.6 },
    { label: ml("25 a 34 anos", "25 to 34 years", "25 a 34 años"), value: 22.6 },
    { label: ml("18 a 24 anos", "18 to 24 years", "18 a 24 años"), value: 19.7 },
    { label: ml("45 a 54 anos", "45 to 54 years", "45 a 54 años"), value: 9.7 },
  ],
  network: [
    { value: "120+", label: ml("jornalistas e colunistas", "journalists and columnists", "periodistas y columnistas") },
    { value: "80", label: ml("revistas parceiras", "partner magazines", "revistas asociadas") },
    { value: "40", label: ml("rádios e podcasts", "radios and podcasts", "radios y podcasts") },
    { value: "50", label: ml("portais de notícia", "news portals", "portales de noticias") },
  ],
  channels: [
    { label: ml("Portal", "Portal", "Portal"), value: 7900 },
    { label: ml("Revista digital", "Digital magazine", "Revista digital"), value: 1800 },
    { label: ml("Redes sociais", "Social media", "Redes sociales"), value: 2300 },
    { label: ml("YOUR Play", "YOUR Play", "YOUR Play"), value: 1200 },
  ],
  formats: [
    { id: "release", name: ml("Release + distribuição", "Release + distribution", "Comunicado + distribución"), desc: ml("Texto, fotos em alta e envio para 170 veículos", "Text, hi-res photos and delivery to 170 outlets", "Texto, fotos en alta y envío a 170 medios"), price: 4800, reach: 320000 },
    { id: "article", name: ml("Matéria no portal", "Portal article", "Artículo en el portal"), desc: ml("Matéria com fotos, linkada nas redes", "Article with photos, shared on social", "Artículo con fotos, compartido en redes"), price: 9200, reach: 1200000 },
    { id: "cover", name: ml("Capa + entrevista", "Cover + interview", "Portada + entrevista"), desc: ml("Ensaio, entrevista exclusiva e distribuição social", "Shoot, exclusive interview and social distribution", "Sesión, entrevista exclusiva y distribución social"), price: 24000, reach: 2300000 },
    { id: "video", name: ml("Vídeo YOUR Play", "YOUR Play video", "Vídeo YOUR Play"), desc: ml("Até 12 min, com corte vertical incluso", "Up to 12 min, vertical cut included", "Hasta 12 min, corte vertical incluido"), price: 16500, reach: 890000 },
    { id: "collection", name: ml("Página na coleção", "Collection page", "Página en la colección"), desc: ml("Luxury Hotels ou Fine Dining por 12 meses", "Luxury Hotels or Fine Dining for 12 months", "Luxury Hotels o Fine Dining por 12 meses"), price: 7400, reach: 150000 },
    { id: "newsletter", name: ml("Newsletter", "Newsletter", "Newsletter"), desc: ml("Destaque em um envio semanal", "Feature in one weekly send", "Destaque en un envío semanal"), price: 3900, reach: 80000 },
  ],
  relationsOptions: [
    { id: "release", name: ml("Release + distribuição nacional", "Release + national distribution", "Comunicado + distribución nacional"), desc: ml("Redação jornalística, fotos em alta e disparo para jornalistas", "Journalistic writing, hi-res photos and press outreach", "Redacción periodística, fotos en alta y envío a prensa"), price: 4800, reach: 320000, formats: 3 },
    { id: "article", name: ml("Matéria editorial no portal", "Editorial story on the portal", "Reportaje editorial en el portal"), desc: ml("Reportagem completa publicada na YOUR com amplificação social", "Full feature story published on YOUR with social amplification", "Reportaje completo publicado en YOUR con amplificación social"), price: 9200, reach: 1200000, formats: 5 },
    { id: "cover", name: ml("Capa Digital + Entrevista Exclusiva", "Digital Cover + Exclusive Interview", "Portada Digital + Entrevista Exclusiva"), desc: ml("Direção criativa, capa exclusiva, entrevista e lançamento multiplataforma", "Creative direction, exclusive cover, interview and cross-platform launch", "Dirección creativa, portada exclusiva, entrevista y lanzamiento multiplataforma"), price: 24000, reach: 2300000, formats: 8 },
    { id: "video", name: ml("Episódio / Especial YOUR Play", "YOUR Play Episode / Special", "Episodio / Especial YOUR Play"), desc: ml("Produção audiovisual para o streaming da revista + cortes", "Audiovisual production for the magazine streaming + vertical cuts", "Producción audiovisual para el streaming de la revista + cortes"), price: 16500, reach: 890000, formats: 4 },
    { id: "network", name: ml("Amplificação na Rede de 170 Veículos", "Amplification in 170-Outlet Network", "Amplificación en Red de 170 Medios"), desc: ml("80 revistas parceiras, 40 rádios/podcasts e 50 portais de notícias", "80 partner magazines, 40 radios/podcasts and 50 news portals", "80 revistas asociadas, 40 radios/podcasts y 50 portales de noticias"), price: 12800, reach: 4100000, formats: 6 },
    { id: "event", name: ml("Cobertura de Evento & PR", "Event Coverage & PR", "Cobertura de Evento y PR"), desc: ml("Presença editorial in loco, flashes ao vivo e dossiê pós-evento", "On-site editorial presence, live social flashes and post-event dossier", "Presencia editorial in situ, cobertura en vivo y dossier post-evento"), price: 21000, reach: 640000, formats: 7 },
  ],
  relationsSteps: [
    {
      step: "01",
      title: ml("Diagnóstico & Posicionamento", "Diagnosis & Positioning", "Diagnóstico y Posicionamiento"),
      desc: ml("Mapeamos o momento da marca, seus diferenciais competitivos, porta-vozes e metas de reputação no mercado de luxo e lifestyle.", "We map the brand's moment, competitive edges, spokespeople and reputation goals in the luxury and lifestyle market.", "Mapeamos el momento de la marca, sus diferenciales competitivos, voceros y metas de reputación en el mercado de lujo y lifestyle."),
      deliverable: ml("Briefing estratégico + mapa de ângulos editoriais", "Strategic brief + editorial angle map", "Briefing estratégico + mapa de ángulos editoriales"),
    },
    {
      step: "02",
      title: ml("Engenharia de Narrativa", "Narrative Engineering", "Ingeniería de Narrativa"),
      desc: ml("Transformamos dados e bastidores em pauta jornalística de alto valor: textos autorais, direção de arte, fotografia e roteiro audiovisual.", "We turn data and behind-the-scenes into high-value journalism: original texts, art direction, photography and video script.", "Transformamos datos y bastidores en pauta periodística de alto valor: textos de autor, dirección de arte, fotografía y guion audiovisual."),
      deliverable: ml("Matéria, capa ou episódio aprovado + press kit", "Approved story, cover or episode + press kit", "Artículo, portada o episodio aprobado + press kit"),
    },
    {
      step: "03",
      title: ml("Publicação no Ecossistema YOUR", "Publication in the YOUR Ecosystem", "Publicación en el Ecosistema YOUR"),
      desc: ml("O conteúdo estreia com destaque no portal, nas edições interativas, no streaming YOUR Play e nas redes sociais oficiais da revista.", "The content debuts across the portal, interactive issues, YOUR Play streaming and the magazine's official social channels.", "El contenido se estrena en el portal, las ediciones interactivas, el streaming YOUR Play y las redes oficiales de la revista."),
      deliverable: ml("Publicação imediata + ativos digitais e PDF de imprensa", "Immediate publication + digital assets and press PDF", "Publicación inmediata + activos digitales y PDF de prensa"),
    },
    {
      step: "04",
      title: ml("Distribuição na Rede de Imprensa", "Press Network Distribution", "Distribución en la Red de Prensa"),
      desc: ml("Levamos a notícia diretamente a mais de 120 jornalistas, 80 revistas parceiras, 40 rádios e podcasts e 50 portais de notícia no Brasil e no exterior.", "We pitch the story directly to 120+ journalists, 80 partner magazines, 40 radios and podcasts and 50 news portals in Brazil and abroad.", "Llevamos la noticia directamente a más de 120 periodistas, 80 revistas asociadas, 40 radios y podcasts y 50 portales de noticias."),
      deliverable: ml("Follow-up ativo com redações e colunistas", "Active follow-up with newsrooms and columnists", "Seguimiento activo con redacciones y columnistas"),
    },
    {
      step: "05",
      title: ml("Clipping & Relatório Executivo", "Clipping & Executive Report", "Clipping e Informe Ejecutivo"),
      desc: ml("Consolidamos todas as inserções conquistadas, alcance estimado, visualizações e valoração de mídia em um dossiê executivo completo.", "We consolidate all earned placements, estimated reach, views and media valuation into a complete executive dossier.", "Consolidamos todas las inserciones logradas, alcance estimado, visualizaciones y valoración de medios en un dossier ejecutivo."),
      deliverable: ml("Dossiê de resultados + acervo permanente na Sala de Imprensa", "Results dossier + permanent archive in the Press Room", "Dossier de resultados + archivo permanente en Sala de Prensa"),
    },
  ],
  links: {
    heroPrimary: { label: ml("Ver a edição", "See the issue", "Ver la edición"), href: "/editions" },
    heroCovers: { label: ml("Capas + entrevistas", "Covers + interviews", "Portadas + entrevistas"), href: "/covers" },
    heroNews: { label: ml("Ler as notícias", "Read the news", "Leer las noticias"), href: "/news" },
    seeAllEditions: { label: ml("Ver todas", "See all", "Ver todas"), href: "/editions" },
    seeAllCovers: { label: ml("Ver todas as capas", "See all covers", "Ver todas las portadas"), href: "/covers" },
    seeAllNews: { label: ml("Ver todas", "See all", "Ver todas"), href: "/news" },
    seeAllPlay: { label: ml("Ver tudo", "See all", "Ver todo"), href: "/play" },
    seeAllHotels: { label: ml("Ver Luxury Hotels", "See Luxury Hotels", "Ver Luxury Hotels"), href: "/hotels" },
    seeAllDining: { label: ml("Ver Fine Dining", "See Fine Dining", "Ver Fine Dining"), href: "/fine-dining" },
    seeAllColumnists: { label: ml("Ver nosso time", "See our team", "Ver nuestro equipo"), href: "/columnists" },
    relations: { label: ml("Media Relations", "Media Relations", "Media Relations"), href: "/relations" },
    pressRoom: { label: ml("Sala de imprensa", "Press room", "Sala de prensa"), href: "/press" },
    mediaKit: { label: ml("Ver o mídia kit", "View the media kit", "Ver el media kit"), href: "/media-kit" },
    founder: { label: ml("O fundador", "The founder", "El fundador"), href: "/fundador" },
    relacionamento: { label: ml("Relacionamento", "Contact & Feedback", "Relacionamiento"), href: "/relacionamento" },
    subscribe: { label: ml("Assine", "Subscribe", "Suscríbete"), href: "/subscribe" },
  },
  images: {
    heroBackground: { label: "Imagem do hero (home)", url: "" },
    hotelsHero: { label: "Banner Luxury Hotels", url: ref.hotelHero || "" },
    diningHero: { label: "Banner Fine Dining", url: ref.dining.hero || "" },
    mediaKitHero: { label: "Banner do mídia kit", url: "" },
    relationsHero: { label: "Banner principal Media Relations", url: "" },
    relationsProcess: { label: "Foto do processo Media Relations", url: "" },
    relationsAudience: { label: "Foto da audiência Media Relations", url: "" },
    relationsVertical1: { label: "Foto YOUR Magazine", url: "" },
    relationsVertical2: { label: "Foto YOUR Press", url: "" },
    relationsVertical3: { label: "Foto YOUR Newswire", url: "" },
    relationsVertical4: { label: "Foto YOUR Content Studio", url: "" },
    relationsVertical5: { label: "Foto YOUR Media Network", url: "" },
    playHero: { label: "Banner do YOUR Play", url: "" },
    founderPortrait: { label: "Foto retrato d'O Fundador", url: "/brand/muller-1.jpeg" },
    founderCollage: { label: "Mosaico de carreira d'O Fundador", url: "/brand/muller-0.jpeg" },
    founderSignature: { label: "Assinatura d'O Fundador", url: "/brand/muller-2.png" },
  },
  social: [
    { label: "Instagram", url: "https://instagram.com/yourmag.nyc" },
    { label: "YouTube", url: "https://youtube.com/@yourmagazine" },
      { label: "Edições Online", url: "https://edicoesyour.online" },
  ],
  ticker: [
    { text: ml("Edição 88 interativa já disponível", "Interactive Issue 88 is out now", "Edición 88 interactiva ya disponible"), href: "/editions" },
    { text: ml("Capas + Entrevistas exclusivas", "Exclusive Covers + Interviews", "Portadas + Entrevistas exclusivas"), href: "/covers" },
    { text: ml("Luxury Hotels & Fine Dining Collections", "Luxury Hotels & Fine Dining Collections", "Luxury Hotels & Fine Dining Collections"), href: "/hotels" },
    { text: ml("YOUR Play: assista às séries e entrevistas", "YOUR Play: watch series and interviews", "YOUR Play: mira series y entrevistas"), href: "/play" },
  ],
  catalog: catalogData as unknown as Record<string, unknown>,
  theme: {
    ink: "#12060A",
    surface: "#1D0A12",
    wine: "#3A0B1C",
    wine2: "#5C1830",
    rose: "#E9A7B8",
    gold: "#D9B26A",
    text: "#F7EEF0",
    mute: "#B99AA4",
    line: "#3b1a26",
    paper: "#F7F1F2",
    paperink: "#24101A",
  },
};

export const seedLanguages = [
  { code: "pt", name: "Portuguese", nativeName: "Português", flag: "🇧🇷", isDefault: true, position: 0 },
  { code: "en", name: "English", nativeName: "English", flag: "🇺🇸", isDefault: false, position: 1 },
  { code: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", isDefault: false, position: 2 },
];

export const seedMenu = [
  { area: "rail", group: "Portal", icon: "T", badge: "", kind: "route", href: "/home", label: ml("Entrada", "Lobby", "Entrada") },
  { area: "rail", group: "Portal", icon: "1", badge: "", kind: "route", href: "/news", label: ml("News", "News", "Noticias") },
  { area: "rail", group: "Portal", icon: "2", badge: "", kind: "route", href: "/editions", label: ml("Edições", "Issues", "Ediciones") },
  { area: "rail", group: "Portal", icon: "3", badge: "", kind: "route", href: "/covers", label: ml("Capas + Entrevistas", "Covers + Interviews", "Portadas + Entrevistas") },
  { area: "rail", group: "Portal", icon: "4", badge: "TV", kind: "route", href: "/play", label: ml("YOUR Play", "YOUR Play", "YOUR Play") },
  { area: "rail", group: "Coleções", icon: "5", badge: "", kind: "route", href: "/hotels", label: ml("Luxury Hotels", "Luxury Hotels", "Luxury Hotels") },
  { area: "rail", group: "Coleções", icon: "6", badge: "", kind: "route", href: "/fine-dining", label: ml("Fine Dining", "Fine Dining", "Fine Dining") },
  { area: "rail", group: "Revista", icon: "7", badge: "", kind: "route", href: "/columnists", label: ml("Nosso Time", "Our Team", "Nuestro Equipo") },
  { area: "rail", group: "Revista", icon: "M", badge: "", kind: "route", href: "/fundador", label: ml("O Fundador", "The Founder", "El Fundador") },
  { area: "rail", group: "Comercial & PR", icon: "8", badge: "", kind: "route", href: "/relations", label: ml("Media Relations", "Media Relations", "Media Relations") },
  { area: "rail", group: "Comercial & PR", icon: "9", badge: "", kind: "route", href: "/press", label: ml("Sala de imprensa", "Press room", "Sala de prensa") },
  { area: "rail", group: "Comercial & PR", icon: "R", badge: "", kind: "route", href: "/media-kit", label: ml("Mídia kit", "Media kit", "Media kit") },
  { area: "rail", group: "Comercial & PR", icon: "O", badge: "novo", kind: "route", href: "/budget", label: ml("Orçamento", "Quote", "Presupuesto") },
  { area: "rail", group: "Comercial & PR", icon: "C", badge: "", kind: "route", href: "/relacionamento", label: ml("Relacionamento", "Contact & Feedback", "Relacionamiento") },
  { area: "rail", group: "Comercial & PR", icon: "✉", badge: "", kind: "route", href: "/subscribe", label: ml("Assine a YOUR", "Subscribe to YOUR", "Suscríbete a YOUR") },
  { area: "rail", group: "Gestão", icon: "A", badge: "", kind: "route", href: "/admin", label: ml("Admin", "Admin", "Admin") },

  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/news", label: ml("News", "News", "Noticias") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/editions", label: ml("Edições", "Issues", "Ediciones") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/covers", label: ml("Capas + Entrevistas", "Covers + Interviews", "Portadas + Entrevistas") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/play", label: ml("YOUR Play", "YOUR Play", "YOUR Play") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/hotels", label: ml("Luxury Hotels", "Luxury Hotels", "Luxury Hotels") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/fine-dining", label: ml("Fine Dining", "Fine Dining", "Fine Dining") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/columnists", label: ml("Nosso Time", "Our Team", "Nuestro Equipo") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/fundador", label: ml("O Fundador", "The Founder", "El Fundador") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/budget", label: ml("Orçamento", "Quote", "Presupuesto") },
  { area: "top", group: null, icon: "", badge: "", kind: "route", href: "/relacionamento", label: ml("Relacionamento", "Contact", "Relacionamiento") },

  { area: "footer", group: "Institucional", icon: "", badge: "", kind: "route", href: "/about", label: ml("Sobre a YOUR", "About YOUR", "Sobre YOUR") },
  { area: "footer", group: "Institucional", icon: "", badge: "", kind: "route", href: "/fundador", label: ml("O Fundador", "The Founder", "El Fundador") },
  { area: "footer", group: "Institucional", icon: "", badge: "", kind: "route", href: "/columnists", label: ml("Nosso Time", "Our Team", "Nuestro Equipo") },
  { area: "footer", group: "Institucional", icon: "", badge: "", kind: "route", href: "/relacionamento", label: ml("Relacionamento e Contatos", "Relationship & Contact", "Relacionamiento y Contacto") },
  { area: "footer", group: "Institucional", icon: "", badge: "", kind: "route", href: "/press", label: ml("Sala de imprensa", "Press room", "Sala de prensa") },
  { area: "footer", group: "Institucional", icon: "", badge: "", kind: "route", href: "/media-kit", label: ml("Mídia kit", "Media kit", "Media kit") },
  { area: "footer", group: "Legal", icon: "", badge: "", kind: "route", href: "/privacy", label: ml("Privacidade", "Privacy", "Privacidad") },
  { area: "footer", group: "Legal", icon: "", badge: "", kind: "route", href: "/terms", label: ml("Termos de uso", "Terms of use", "Términos de uso") },
];

export const seedPages = [
  {
    slug: "home", template: "home", position: 0, showInMenu: true, published: true, image: "",
    title: ml("Entrada", "Lobby", "Entrada"),
    kicker: ml("Portal", "Portal", "Portal"),
    subtitle: ml("Escolha por onde começar", "Choose where to start", "Elige por dónde empezar"),
    blocks: [],
  },
  {
    slug: "news", template: "news", position: 1, showInMenu: true, published: true,
    title: ml("News", "News", "Noticias"),
    kicker: ml(" Editorial", "Editorial", "Editorial"),
    subtitle: ml("Últimas reportagens, entrevistas e notas da YOUR Magazine, organizadas por editoria.", "Latest stories, interviews and notes from YOUR Magazine, sorted by desk.", "Últimos reportajes, entrevistas y notas de YOUR Magazine, ordenados por sección."),
    blocks: [],
  },
  {
    slug: "editions", template: "editions", position: 2, showInMenu: true, published: true,
    title: ml("Edições", "Issues", "Ediciones"),
    kicker: ml("Acervo YOUR", "YOUR Archive", "Archivo YOUR"),
    subtitle: ml("A estante completa: 88 edições da YOUR Magazine. Clique numa capa para abrir.", "The full shelf: 88 issues of YOUR Magazine. Click any cover to open.", "El estante completo: 88 ediciones de YOUR Magazine. Haz clic en una portada para abrir."),
    blocks: [],
  },
  {
    slug: "covers", template: "covers", position: 3, showInMenu: true, published: true,
    title: ml("Capas + Entrevistas", "Covers + Interviews", "Portadas + Entrevistas"),
    kicker: ml("Galeria", "Gallery", "Galería"),
    subtitle: ml("Rostos, ensaios e entrevistas exclusivas por trás de cada capa.", "Faces, shoots and exclusive interviews behind every cover.", "Rostros, sesiones y entrevistas exclusivas detrás de cada portada."),
    blocks: [],
  },
  {
    slug: "play", template: "play", position: 4, showInMenu: true, published: true,
    title: ml("YOUR Play", "YOUR Play", "YOUR Play"),
    kicker: ml("Streaming", "Streaming", "Streaming"),
    subtitle: ml("O streaming da revista YOUR: séries originais, entrevistas, bastidores e especiais.", "YOUR Magazine's streaming platform: original series, interviews, behind-the-scenes and specials.", "El streaming de la revista YOUR: series originales, entrevistas, bastidores y especiales."),
    blocks: [],
  },
  {
    slug: "hotels", template: "hotels", position: 5, showInMenu: true, published: true,
    title: ml("Luxury Hotels Collection", "Luxury Hotels Collection", "Luxury Hotels Collection"),
    kicker: ml("A curadoria YOUR", "The YOUR curation", "La curaduría YOUR"),
    subtitle: ml("Hospedagens em que o luxo encontra a autenticidade da hospitalidade brasileira — com sugestões gastronômicas na mesma região.", "Stays where luxury meets the authenticity of Brazilian hospitality — with fine dining suggestions in the same region.", "Alojamientos donde el lujo se encuentra con la autenticidad de la hospitalidad brasileña — con sugerencias gastronómicas en la misma región."),
    blocks: [],
  },
  {
    slug: "fine-dining", template: "fine-dining", position: 6, showInMenu: true, published: true,
    title: ml("Fine Dining Collection", "Fine Dining Collection", "Fine Dining Collection"),
    kicker: ml("A curadoria YOUR", "The YOUR curation", "La curaduría YOUR"),
    subtitle: ml("Uma seleção de 55 endereços em 8 destinos onde a excelência encontra a autenticidade de cada mesa — com sugestão de onde se hospedar em cada cidade.", "A selection of 55 addresses across 8 destinations where excellence meets authenticity — with hotel recommendations in each city.", "Una selección de 55 direcciones en 8 destinos donde la excelencia se encuentra con la autenticidad de cada mesa — con sugerencias de hospedaje en cada ciudad."),
    blocks: [],
  },
  {
    slug: "collections", template: "collections", position: 7, showInMenu: false, published: true,
    title: ml("Collections", "Collections", "Colecciones"),
    kicker: ml("A curadoria YOUR", "The YOUR curation", "La curaduría YOUR"),
    subtitle: ml("Luxury Hotels Collection e Fine Dining Collection: duas curadorias complementares de hospitalidade e alta gastronomia.", "Luxury Hotels Collection and Fine Dining Collection: two complementary curations of hospitality and fine dining.", "Luxury Hotels Collection y Fine Dining Collection: dos curadurías complementarias de hospitalidad y alta gastronomía."),
    blocks: [],
  },
  {
    slug: "columnists", template: "columnists", position: 8, showInMenu: true, published: true,
    title: ml("Nosso Time", "Our Team", "Nuestro Equipo"),
    kicker: ml("Quem faz a YOUR", "Who makes YOUR", "Quién hace YOUR"),
    subtitle: ml("Especialistas, médicos, psicólogos, criadores e jornalistas que assinam as colunas e editorias da revista.", "Experts, doctors, psychologists, creators and journalists who write the magazine's columns and desks.", "Especialistas, médicos, psicólogos, creadores y periodistas que firman las columnas y secciones de la revista."),
    blocks: [],
  },
  {
    slug: "fundador", template: "founder", position: 9, showInMenu: true, published: true, image: "/brand/muller-1.jpeg",
    title: ml("Müller Ribeiro", "Müller Ribeiro", "Müller Ribeiro"),
    kicker: ml("O Fundador", "The Founder", "El Fundador"),
    subtitle: ml(
      "CEO, Editor-Chefe e Comunicólogo. Liderança criativa que integra visão global, engenharia editorial e neurodiversidade como diferencial estratégico no mercado internacional de luxo.",
      "CEO, Editor-in-Chief and Communications Scholar. Creative leadership that integrates global vision, editorial engineering and neurodiversity as a strategic edge in the international luxury market.",
      "CEO, Editor en Jefe y Comunicólogo. Liderazgo creativo que integra visión global, ingeniería editorial y neurodiversidad como diferencial estratégico en el mercado internacional del lujo.",
    ),
    blocks: [],
  },
  {
    slug: "relations", template: "relations", position: 10, showInMenu: true, published: true,
    title: ml("Media Relations", "Media Relations", "Media Relations"),
    kicker: ml("Assessoria & PR", "Press Relations & PR", "Relaciones Públicas y PR"),
    subtitle: ml("Criamos a notícia, publicamos na revista e levamos à nossa rede de imprensa no Brasil e nos Estados Unidos.", "We create the story, publish it in the magazine and push it to our press network in Brazil and the US.", "Creamos la noticia, la publicamos en la revista y la llevamos a nuestra red de prensa en Brasil y EE. UU."),
    blocks: [],
  },
  {
    slug: "press", template: "press", position: 11, showInMenu: true, published: true,
    title: ml("Sala de imprensa", "Press room", "Sala de prensa"),
    kicker: ml("Releases & Clipping", "Releases & Clipping", "Comunicados y Clipping"),
    subtitle: ml("Todos os conteúdos publicados nas edições interativas e todas as capas da revista, com release de ~600 palavras em PDF timbrado com o logo oficial para download.", "All stories published in the interactive issues and all magazine covers, with a ~600-word press release in official branded PDF ready for download.", "Todos los contenidos publicados en las ediciones interactivas y todas las portadas de la revista, con comunicado de ~600 palabras en PDF oficial para descargar."),
    blocks: [],
  },
  {
    slug: "media-kit", template: "media-kit", position: 12, showInMenu: true, published: true,
    title: ml("Mídia kit", "Media kit", "Media kit"),
    kicker: ml("Comercial", "Sales & Partnerships", "Comercial"),
    subtitle: ml("Audiência, perfil demográfico, canais de distribuição, calculadora de planos e marcas que fazem parte da história.", "Audience, demographics, distribution channels, plan calculator and the brands that are part of our story.", "Audiencia, perfil demográfico, canales de distribución, calculadora de planes y marcas que forman parte de la historia."),
    blocks: [],
  },
  {
    slug: "relacionamento", template: "relacionamento", position: 13, showInMenu: true, published: true,
    title: ml("Relacionamento & Contatos", "Relationship & Contact", "Relacionamiento y Contacto"),
    kicker: ml("Fale com a YOUR", "Talk to YOUR", "Habla con YOUR"),
    subtitle: ml("Dúvidas, sugestões, elogios, pautas e parcerias. Vamos conversar? Queremos saber sua opinião.", "Questions, suggestions, praise, story pitches and partnerships. Shall we talk? We want to hear your opinion.", "Dudas, sugerencias, elogios, pautas y alianzas. ¿Conversamos? Queremos conocer tu opinión."),
    blocks: [],
  },
  {
    slug: "about", template: "custom", position: 20, showInMenu: true, published: true, image: px(ART_PX[2], 1600, 900),
    title: ml("Sobre a YOUR", "About YOUR", "Sobre YOUR"),
    kicker: ml("Institucional", "Institutional", "Institucional"),
    subtitle: ml("Dez anos de revista 100% digital, feita no Brasil para o mundo.", "Ten years of a 100% digital magazine, made in Brazil for the world.", "Diez años de revista 100% digital, hecha en Brasil para el mundo."),
    blocks: [
      { type: "paragraph", text: ml("A YOUR nasceu há 10 anos como uma revista digital de luxo e consolidou um ecossistema editorial completo: portal de notícias, capas com entrevistas exclusivas, 88 edições folheáveis e interativas, streaming de vídeo YOUR Play, curadorias Luxury Hotels e Fine Dining e assessoria de imprensa internacional.", "YOUR started 10 years ago as a digital luxury magazine and built a full editorial ecosystem: news portal, covers with exclusive interviews, 88 browsable and interactive issues, YOUR Play video streaming, Luxury Hotels and Fine Dining curations and international press relations.", "YOUR nació hace 10 años como una revista digital de lujo y consolidó un ecosistema editorial completo: portal de noticias, portadas con entrevistas exclusivas, 88 ediciones interactivas, streaming YOUR Play, curadurías Luxury Hotels y Fine Dining y relaciones públicas internacionales.") },
      { type: "stats", items: [{ value: "10", label: ml("anos", "years", "años") }, { value: "88", label: ml("edições", "issues", "ediciones") }, { value: "13,2 mi", label: ml("views/mês", "views/month", "views/mes") }] },
      { type: "heading", text: ml("Como trabalhamos", "How we work", "Cómo trabajamos") },
      { type: "columns", columns: [
        { title: ml("Curadoria", "Curation", "Curaduría"), text: ml("Cada pauta passa por uma curadoria editorial rigorosa antes de virar capa, matéria, coleção ou vídeo.", "Every story goes through editorial curation before becoming a cover, article, collection or video.", "Cada tema pasa por una curaduría editorial antes de convertirse en portada, artículo, colección o vídeo.") },
        { title: ml("Produção", "Production", "Producción"), text: ml("Direção criativa, fotografia, edição audiovisual e engenharia editorial para formatos digitais imersivos.", "Creative direction, photography, video editing and editorial engineering for immersive digital formats.", "Dirección creativa, fotografía, edición audiovisual e ingeniería editorial para formatos digitales inmersivos.") },
        { title: ml("Distribuição", "Distribution", "Distribución"), text: ml("Rede com 120+ jornalistas, 80 revistas parceiras, 40 rádios e podcasts e 50 portais de notícias.", "Network with 120+ journalists, 80 partner magazines, 40 radios and podcasts and 50 news portals.", "Red con 120+ periodistas, 80 revistas asociadas, 40 radios y podcasts y 50 portales de noticias.") },
      ] },
      { type: "cta", label: ml("Falar com o relacionamento", "Contact us", "Hablar con nosotros"), href: "/relacionamento" },
    ],
  },
  {
    slug: "contact", template: "relacionamento", position: 21, showInMenu: false, published: true,
    title: ml("Fale conosco", "Contact us", "Contáctenos"),
    kicker: ml("Institucional", "Institutional", "Institucional"),
    subtitle: ml("Pautas, parcerias, imprensa e comercial.", "Stories, partnerships, press and sales.", "Temas, alianzas, prensa y comercial."),
    blocks: [],
  },
  {
    slug: "subscribe", template: "custom", position: 22, showInMenu: true, published: true,
    title: ml("Assine a YOUR", "Subscribe to YOUR", "Suscríbete a YOUR"),
    kicker: ml("Clube YOUR", "YOUR Club", "Club YOUR"),
    subtitle: ml("Receba as edições, capas, vídeos e curadorias de gastronomia e viagens antes de todo mundo.", "Get issues, covers, videos and dining & travel curations before everyone else.", "Recibe las ediciones, portadas, vídeos y curadurías de gastronomía y viajes antes que nadie."),
    blocks: [
      { type: "columns", columns: [
        { title: ml("Leitor", "Reader", "Lector"), text: ml("Grátis — newsletter semanal com a curadoria da YOUR Magazine.", "Free — weekly newsletter with YOUR Magazine's curation.", "Gratis — boletín semanal con la curaduría de YOUR Magazine.") },
        { title: ml("Insider", "Insider", "Insider"), text: ml("Acesso antecipado às edições interativas e ao acervo completo de 10 anos.", "Early access to interactive issues and the full 10-year archive.", "Acceso anticipado a las ediciones interactivas y al archivo completo de 10 años.") },
        { title: ml("Front Row", "Front Row", "Front Row"), text: ml("Convites para eventos, pré-estreias e experiências com marcas parceiras.", "Invites to events, previews and experiences with partner brands.", "Invitaciones a eventos, preestrenos y experiencias con marcas aliadas.") },
      ] },
      { type: "cta", label: ml("Entrar em contato", "Get in touch", "Ponerse en contacto"), href: "/relacionamento" },
    ],
  },
  {
    slug: "privacy", template: "custom", position: 30, showInMenu: true, published: true,
    title: ml("Privacidade", "Privacy", "Privacidad"),
    kicker: ml("Legal", "Legal", "Legal"),
    blocks: [
      { type: "paragraph", text: ml("Coletamos apenas os dados necessários para operar o portal: preferências de idioma e tema, métricas de leitura, contatos enviados pelos formulários e e-mails cadastrados no Clube YOUR mediante consentimento.", "We collect only the data needed to run the portal: language and theme preferences, reading metrics, form submissions and email addresses registered with the YOUR Club with consent.", "Recogemos solo los datos necesarios para operar el portal: preferencias de idioma y tema, métricas de lectura, contactos enviados por formularios y correos registrados en el Club YOUR con consentimiento.") },
      { type: "paragraph", text: ml("Você pode cancelar o recebimento de novidades ou solicitar a exclusão dos seus dados a qualquer momento pelo e-mail da redação: muller@yourmagazine.com.br.", "You may unsubscribe from email updates or request deletion of your data at any time via the newsroom email: muller@yourmagazine.com.br.", "Puede cancelar las novedades por correo o solicitar la eliminación de sus datos en cualquier momento escribiendo a la redacción: muller@yourmagazine.com.br.") },
    ],
  },
  {
    slug: "terms", template: "custom", position: 31, showInMenu: true, published: true,
    title: ml("Termos de uso", "Terms of use", "Términos de uso"),
    kicker: ml("Legal", "Legal", "Legal"),
    blocks: [
      { type: "paragraph", text: ml("Todo o conteúdo publicado é de titularidade da YOUR Magazine ou de seus parceiros, sendo proibida a reprodução sem autorização ou sem o crédito oficial da Sala de Imprensa.", "All published content is owned by YOUR Magazine or its partners; reproduction without authorization or official Press Room credit is prohibited.", "Todo el contenido publicado es propiedad de YOUR Magazine o de sus socios; queda prohibida su reproducción sin autorización o sin el crédito oficial de la Sala de Prensa.") },
      { type: "list", items: [ml("Uso pessoal e editorial mediante crédito.", "Personal and editorial use with credit.", "Uso personal y editorial con crédito."), ml("Releases oficiais disponíveis em PDF na Sala de Imprensa.", "Official releases available in PDF in the Press Room.", "Comunicados oficiales disponibles en PDF en la Sala de Prensa."), ml("Parcerias comerciais via Media Relations.", "Commercial partnerships through Media Relations.", "Alianzas comerciales vía Media Relations.")] },
    ],
  },
];

const brandsSeed: SeedItem[] = [
  { id: "brand-belmond", type: "brand", position: 1, image: px(HOTEL_PX[2], 800, 600), title: ml("Belmond", "Belmond", "Belmond"), dek: ml("Parceria de longa data", "Long-standing partnership", "Alianza de largo plazo"), category: "Hotelaria", meta: { since: 2016 } },
  { id: "brand-maserati", type: "brand", position: 2, title: ml("Maserati", "Maserati", "Maserati"), dek: ml("Parceria de longa data", "Long-standing partnership", "Alianza de largo plazo"), category: "Motor", meta: { since: 2018 } },
  { id: "brand-rollsroyce", type: "brand", position: 3, title: ml("Rolls-Royce", "Rolls-Royce", "Rolls-Royce"), dek: ml("Parceria de longa data", "Long-standing partnership", "Alianza de largo plazo"), category: "Motor", meta: { since: 2019 } },
  { id: "brand-brandusa", type: "brand", position: 4, title: ml("Brand USA", "Brand USA", "Brand USA"), dek: ml("Conteúdo", "Content partner", "Contenido"), category: "Turismo", meta: { since: 2021 } },
  { id: "brand-stampa", type: "brand", position: 5, title: ml("Stampa", "Stampa", "Stampa"), dek: ml("Conteúdo", "Content partner", "Contenido"), category: "Moda", meta: { since: 2020 } },
  { id: "brand-dux", type: "brand", position: 6, title: ml("DUX Human Health", "DUX Human Health", "DUX Human Health"), dek: ml("Parceiro Edição 88", "Issue 88 Partner", "Socio Edición 88"), category: "Saúde", meta: { since: 2022 } },
  { id: "brand-nino", type: "brand", position: 7, image: px(FOOD_PX[1], 800, 600), title: ml("Nino Cucina", "Nino Cucina", "Nino Cucina"), dek: ml("Gastronomia", "Gastronomy", "Gastronomía"), category: "Gastronomia", meta: { since: 2023 } },
  { id: "brand-spavinho", type: "brand", position: 8, image: px(FOOD_PX[6], 800, 600), title: ml("Spa do Vinho", "Spa do Vinho", "Spa do Vinho"), dek: ml("Hotelaria", "Hospitality", "Hotelería"), category: "Hotelaria", meta: { since: 2017 } },
  { id: "brand-colline", type: "brand", position: 9, image: px(HOTEL_PX[3], 800, 600), title: ml("Colline de France", "Colline de France", "Colline de France"), dek: ml("Hotelaria", "Hospitality", "Hotelería"), category: "Hotelaria", meta: { since: 2019 } },
  { id: "brand-pullman", type: "brand", position: 10, image: px(HOTEL_PX[0], 800, 600), title: ml("Pullman Hotels", "Pullman Hotels", "Pullman Hotels"), dek: ml("Especial Chile", "Chile Special", "Especial Chile"), category: "Hotelaria", meta: { since: 2024 } },
  { id: "brand-bagaggio", type: "brand", position: 11, title: ml("Bagaggio", "Bagaggio", "Bagaggio"), dek: ml("Especial Chile", "Chile Special", "Especial Chile"), category: "Turismo", meta: { since: 2024 } },
  { id: "brand-cartier", type: "brand", position: 12, image: px(ART_PX[3], 800, 600), title: ml("Fondation Cartier", "Fondation Cartier", "Fondation Cartier"), dek: ml("Cultura", "Culture", "Cultura"), category: "Arte", meta: { since: 2024 } },
];

type RefNews = { slug: string; title: string; title_en?: string; title_es?: string; dek: string; dek_en?: string; dek_es?: string; body: string; category: string; image: string; url: string; date: string; min: number };
type RefCover = { slug: string; person: string; eyebrow: string; deck: string; body: string; credit: string; image: string; url: string };
type RefEdition = { slug: string; number: number; pages: number; kind: string; image: string; url: string };
type RefVideo = { id: string; title: string; author: string; series: string; url: string; thumb: string };
type RefHotel = { id: string; name: string; city: string; uf: string; near: string; text: string; web: string; image: string; photos: string[]; tr: { en: { text: string; cat: string }; es: { text: string; cat: string } } };
type RefRest = { id: string; name: string; dest: string; destKey: string; cat: string; text: string; addr: string; phone: string; ig: string; web: string; hours: string; hotel: string; subs: unknown[]; image: string; photos: string[]; tr: { en: { text: string; cat: string; hours: string }; es: { text: string; cat: string; hours: string } } };
type RefCol = { id: string; name: string; area: string; role: string; reg: string; instagram: string; image: string; past: { t: string; u: string }[]; body: string };
type RefRel = { id: string; title: string; title_en?: string; title_es?: string; dek: string; dek_en?: string; dek_es?: string; body: string; category: string; group: string; image: string; url: string; client: string };

const refItems = (): SeedItem[] => {
  const out: SeedItem[] = [];

  (ref.news as RefNews[]).forEach((n, i) =>
    out.push({
      id: `article-${n.slug}`,
      type: "article",
      position: i + 1,
      featured: i < 2,
      title: ml(n.title, n.title_en || undefined, n.title_es || undefined),
      dek: ml(n.dek, n.dek_en || undefined, n.dek_es || undefined),
      body: ml(n.body),
      category: n.category || "News",
      image: n.image || "",
      url: n.url || "",
      meta: { min: n.min || 3, published: n.date || "" },
    }),
  );

  (ref.covers as RefCover[]).forEach((c, i) =>
    out.push({
      id: `cover-${c.slug}`,
      type: "cover",
      position: i + 1,
      featured: i === 0,
      title: ml(c.person),
      dek: ml(c.deck),
      body: ml(c.body),
      category: c.eyebrow || "Capa Especial",
      image: c.image || "",
      url: c.url || "",
      meta: { role: c.eyebrow || "", credit: c.credit || "" },
    }),
  );

  (ref.editions as RefEdition[]).forEach((e, i) =>
    out.push({
      id: `edition-${e.slug}`,
      type: "edition",
      position: i + 1,
      featured: i === 0,
      title: ml(`Edição ${e.number}`, `Issue ${e.number}`, `Edición ${e.number}`),
      dek: ml(`${e.pages} páginas`, `${e.pages} pages`, `${e.pages} páginas`),
      image: e.image || "",
      url: e.url || "",
      meta: { number: e.number, pages: e.pages, interactive: e.kind === "interativa" },
    }),
  );

  (ref.videos as RefVideo[]).forEach((v, i) =>
    out.push({
      id: `video-${v.id}`,
      type: "video",
      position: i + 1,
      featured: i === 0,
      title: ml(v.title),
      dek: ml(v.author),
      image: v.thumb || "",
      url: v.url || "",
      category: v.series,
      meta: { serie: v.series },
    }),
  );

  (ref.hotels as RefHotel[]).forEach((h, i) =>
    out.push({
      id: `hotel-${h.id}`,
      type: "hotel",
      position: i + 1,
      featured: i < 2,
      title: ml(h.name),
      dek: ml(`${h.city}${h.uf ? `, ${h.uf}` : ""}`),
      body: ml(h.text, h.tr?.en?.text || undefined, h.tr?.es?.text || undefined),
      category: h.uf || "BR",
      image: h.image || "",
      url: h.web || "",
      meta: { collection: "hotels", city: h.city, uf: h.uf, near: h.near, photos: h.photos || [] },
    }),
  );

  (ref.dining.restaurants as RefRest[]).forEach((r, i) =>
    out.push({
      id: `dining-${r.id}`,
      type: "dining",
      position: i + 1,
      featured: i < 3,
      title: ml(r.name),
      dek: ml(r.cat, r.tr?.en?.cat || undefined, r.tr?.es?.cat || undefined),
      body: ml(r.text, r.tr?.en?.text || undefined, r.tr?.es?.text || undefined),
      category: r.dest,
      image: r.image || "",
      url: r.web || (r.ig ? `https://www.instagram.com/${String(r.ig).replace(/^@/, "")}/` : ""),
      meta: {
        collection: "dining",
        dest: r.dest,
        destKey: r.destKey,
        addr: r.addr,
        phone: r.phone,
        ig: r.ig,
        web: r.web,
        hours: r.hours,
        hours_en: r.tr?.en?.hours || "",
        hours_es: r.tr?.es?.hours || "",
        hotel: r.hotel,
        subs: r.subs || [],
        photos: r.photos || [],
      },
    }),
  );

  (ref.columnists as RefCol[]).forEach((c, i) =>
    out.push({
      id: `col-${c.id}`,
      type: "columnist",
      position: i + 1,
      featured: c.id === "muller-ribeiro",
      title: ml(c.name),
      dek: ml(`${c.area}${c.role ? ` · ${c.role}` : ""}`),
      body: ml(c.body),
      category: c.area,
      image: c.image || "",
      url: c.instagram || "",
      meta: { area: c.area, role: c.role, reg: c.reg, instagram: c.instagram, past: c.past || [] },
    }),
  );

  (ref.releases as RefRel[]).forEach((r, i) =>
    out.push({
      id: r.id,
      type: "release",
      position: i + 1,
      featured: i < 3,
      title: ml(r.title, r.title_en || undefined, r.title_es || undefined),
      dek: ml(r.dek, r.dek_en || undefined, r.dek_es || undefined),
      body: ml(r.body),
      category: r.category,
      image: r.image || "",
      url: r.url || "",
      meta: { group: r.group, client: r.client, words: (r.body || "").split(/\s+/).length },
    }),
  );

  return out;
};

export const seedItems: SeedItem[] = [...refItems(), ...brandsSeed];

export const seedUi: { key: string; group: string; values: ML }[] = [
  { key: "nav.lobby", group: "nav", values: ml("Entrada", "Lobby", "Entrada") },
  { key: "nav.search", group: "nav", values: ml("Buscar em tudo", "Search everything", "Buscar en todo") },
  { key: "nav.quickTo", group: "nav", values: ml("Ir direto a", "Jump to", "Ir directo a") },
  { key: "nav.close", group: "nav", values: ml("Fechar", "Close", "Cerrar") },
  { key: "nav.theme", group: "nav", values: ml("Trocar tema", "Toggle theme", "Cambiar tema") },
  { key: "nav.language", group: "nav", values: ml("Idioma", "Language", "Idioma") },
  { key: "action.seeAll", group: "action", values: ml("Ver tudo", "See all", "Ver todo") },
  { key: "action.readNow", group: "action", values: ml("Ler agora", "Read now", "Leer ahora") },
  { key: "action.openIssue", group: "action", values: ml("Abrir a edição", "Open issue", "Abrir la edición") },
  { key: "action.watch", group: "action", values: ml("Assistir", "Watch", "Ver") },
  { key: "action.share", group: "action", values: ml("Compartilhar", "Share", "Compartir") },
  { key: "action.visit", group: "action", values: ml("Abrir link", "Open link", "Abrir enlace") },
  { key: "action.backHome", group: "action", values: ml("Voltar ao início", "Back to home", "Volver al inicio") },
  { key: "action.edit", group: "action", values: ml("Editar", "Edit", "Editar") },
  { key: "action.save", group: "action", values: ml("Salvar", "Save", "Guardar") },
  { key: "action.cancel", group: "action", values: ml("Fechar", "Close", "Cerrar") },
  { key: "action.delete", group: "action", values: ml("Excluir", "Delete", "Eliminar") },
  { key: "action.translate", group: "action", values: ml("Traduzir agora", "Translate now", "Traducir ahora") },
  { key: "action.translateAll", group: "action", values: ml("Traduzir tudo", "Translate everything", "Traducir todo") },
  { key: "label.minRead", group: "label", values: ml("min de leitura", "min read", "min de lectura") },
  { key: "label.latest", group: "label", values: ml("Últimas do portal", "Latest stories", "Lo último") },
  { key: "label.numbers", group: "label", values: ml("Em números", "In numbers", "En cifras") },
  { key: "label.audience", group: "label", values: ml("Quem lê a YOUR", "Who reads YOUR", "Quién lee YOUR") },
  { key: "label.network", group: "label", values: ml("Rede de distribuição", "Distribution network", "Red de distribución") },
  { key: "label.pillars", group: "label", values: ml("Pilares editoriais", "Editorial pillars", "Pilares editoriales") },
  { key: "label.brandsStory", group: "label", values: ml("Marcas que fazem parte da história", "Brands that are part of the story", "Marcas que forman parte de la historia") },
  { key: "label.latestIssue", group: "label", values: ml("Edição mais recente", "Latest issue", "Edición más reciente") },
  { key: "label.moreCovers", group: "label", values: ml("Mais capas", "More covers", "Más portadas") },
  { key: "label.fullGallery", group: "label", values: ml("Galeria completa", "Full gallery", "Galería completa") },
  { key: "label.inTheaters", group: "label", values: ml("Streaming da revista", "Magazine streaming", "Streaming de la revista") },
  { key: "label.hotels", group: "label", values: ml("Luxury Hotels", "Luxury Hotels", "Luxury Hotels") },
  { key: "label.dining", group: "label", values: ml("Fine Dining", "Fine Dining", "Fine Dining") },
  { key: "label.pressReleases", group: "label", values: ml("Releases", "Releases", "Comunicados") },
  { key: "label.simulator", group: "label", values: ml("Simulador de plano", "Plan simulator", "Simulador de plan") },
  { key: "label.results", group: "label", values: ml("resultados", "results", "resultados") },
  { key: "label.noResults", group: "label", values: ml("Nada encontrado. Tente outra busca.", "Nothing found. Try another search.", "No se encontró nada. Prueba otra búsqueda.") },
  { key: "label.allCategories", group: "label", values: ml("Todas as editorias", "All desks", "Todas las secciones") },
  { key: "label.editedBy", group: "label", values: ml("Por", "By", "Por") },
  { key: "label.pages", group: "label", values: ml("páginas", "pages", "páginas") },
  { key: "label.interactive", group: "label", values: ml("Interativa", "Interactive", "Interactiva") },
  { key: "admin.title", group: "admin", values: ml("Painel Admin", "Admin panel", "Panel Admin") },
  { key: "admin.subtitle", group: "admin", values: ml("Tudo aqui é editável: menus, textos, páginas, itens, links, imagens e traduções.", "Everything here is editable: menus, texts, pages, items, links, images and translations.", "Todo aquí es editable: menús, textos, páginas, elementos, enlaces, imágenes y traducciones.") },
  { key: "admin.login", group: "admin", values: ml("Entrar no painel", "Sign in to the panel", "Entrar al panel") },
  { key: "admin.password", group: "admin", values: ml("Senha de administrador", "Admin password", "Contraseña de administrador") },
  { key: "admin.logout", group: "admin", values: ml("Sair", "Log out", "Salir") },
  { key: "admin.saved", group: "admin", values: ml("Salvo no banco.", "Saved to the database.", "Guardado en la base de datos.") },
  { key: "admin.translationDone", group: "admin", values: ml("Traduções atualizadas.", "Translations updated.", "Traducciones actualizadas.") },
  { key: "admin.liveEditing", group: "admin", values: ml("Edição ao vivo ativa", "Live editing on", "Edición en vivo activa") },
];
