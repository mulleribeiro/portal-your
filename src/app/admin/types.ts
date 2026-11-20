export type ML = Record<string, string>;

export type AdminItem = {
  id: string; type: string; title: ML; dek?: ML | null; body?: ML | null;
  category?: string | null; tags?: string[] | null; image?: string | null; url?: string | null;
  meta?: Record<string, unknown> | null; featured: boolean; published: boolean; position: number;
};

export type AdminPage = {
  slug: string; template: string; title: ML; subtitle?: ML | null; kicker?: ML | null;
  image?: string | null; blocks?: unknown[] | null; published: boolean; showInMenu: boolean; position: number;
  previousSlug?: string; seo?: ML | null;
};

export type AdminMenu = {
  id: number; area: string; group?: string | null; label: ML; kind: string; href: string;
  badge?: string | null; icon?: string | null; position: number; hidden: boolean;
};

export type AdminUi = { key: string; group?: string | null; values: ML };
export type AdminLanguage = { code: string; name: string; nativeName: string; flag?: string | null; isDefault: boolean; enabled: boolean; position: number };
export type AdminLog = { id: number; entity: string; entityId?: string | null; action: string; detail?: string | null; at: string };

export type AdminData = {
  admin: boolean;
  engine: string;
  engineLabel: string;
  settings: Record<string, unknown>;
  languages: AdminLanguage[];
  menu: AdminMenu[];
  pages: AdminPage[];
  items: AdminItem[];
  ui: AdminUi[];
  log?: AdminLog[];
  media: { id: number; name: string; mime: string; size: number; createdAt: string }[];
  password?: string;
};

export const CONTENT_TYPES = [
  { id: "article", label: "Matérias" },
  { id: "cover", label: "Capas" },
  { id: "edition", label: "Edições" },
  { id: "video", label: "Vídeos" },
  { id: "columnist", label: "Nosso Time" },
  { id: "brand", label: "Marcas" },
  { id: "hotel", label: "Luxury Hotels" },
  { id: "dining", label: "Fine Dining" },
  { id: "release", label: "Sala de Imprensa" },

  { id: "lead", label: "Leads" },
];
