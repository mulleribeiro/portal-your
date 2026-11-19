import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { isAdminRequest } from "@/lib/auth";
import { loadSite, menuFor, mlPick } from "@/lib/data";
import { EditProvider } from "@/components/EditProvider";
import { Shell, type NavItem } from "@/components/Shell";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  return {
    title: mlPick(site, site.settings.heroTitle as Record<string, string>, lang) || "YOUR",
    description: mlPick(site, site.settings.heroText as Record<string, string>, lang),
    alternates: { languages: Object.fromEntries(site.langs.map((l) => [l, `/${l}`])) },
  };
}

const toNav = (site: Awaited<ReturnType<typeof loadSite>>, list: ReturnType<typeof menuFor>, lang: string): NavItem[] =>
  list.map((m) => ({
    href: m.href,
    label: mlPick(site, m.label, lang),
    icon: m.icon,
    badge: m.badge,
    group: m.group,
  }));

export default async function PortalLayout({
  children, params,
}: { children: React.ReactNode; params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  if (!site.langs.includes(lang)) notFound();

  const store = await cookies();
  const theme = store.get("your_theme")?.value === "light" ? "light" : "dark";
  const canEdit = await isAdminRequest();

  return (
    <EditProvider canEdit={canEdit} lang={lang} langs={site.langs}>
      <Shell
        lang={lang}
        langs={site.languages.map((l) => ({ code: l.code, flag: l.flag, nativeName: l.nativeName }))}
        brand={String(site.settings.brand || "your")}
        logo={String(site.settings.logo || "")}
        slogan={mlPick(site, site.settings.slogan as Record<string, string>, lang)}
        railNav={toNav(site, menuFor(site, "rail"), lang)}
        topNav={toNav(site, menuFor(site, "top"), lang)}
        footerNav={toNav(site, menuFor(site, "footer"), lang)}
        footerText={mlPick(site, site.settings.footerText as Record<string, string>, lang)}
        social={(site.settings.social as { label: string; url: string }[]) || []}
        theme={theme}
        canEdit={canEdit}
      >
        {children}
      </Shell>
    </EditProvider>
  );
}
