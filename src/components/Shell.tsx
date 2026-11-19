"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { SearchOverlay } from "./SearchOverlay";

export type NavItem = { href: string; label: string; icon?: string | null; badge?: string | null; group?: string | null };

export type ShellProps = {
  lang: string;
  langs: { code: string; flag: string | null; nativeName: string }[];
  brand: string;
  logo: string;
  slogan: string;
  railNav: NavItem[];
  topNav: NavItem[];
  footerNav: NavItem[];
  footerText: string;
  social: { label: string; url: string }[];
  theme: string;
  canEdit?: boolean;
  children: React.ReactNode;
};

const isImage = (v?: string | null) => Boolean(v && (v.startsWith("/") || v.startsWith("http")));

async function setCookie(name: string, value: string) {
  try {
    await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [name]: value }),
    });
  } catch {
    /* ignore */
  }
}

function Icon({ value }: { value?: string | null }) {
  if (isImage(value)) return <img src={value as string} alt="" className="h-[22px] w-[22px] rounded object-cover" />;
  return <i>{value || "•"}</i>;
}

export function Shell(props: ShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  // Side menu starts hidden by default; the visitor can open it and the choice is remembered.
  const [open, setOpen] = useState(false);
  const [railOpen, setRailOpen] = useState(false);
  const [search, setSearch] = useState(false);
  const [theme, setTheme] = useState(props.theme);
  const [progress, setProgress] = useState(0);

  /* ---- theme: apply stored choice immediately on hydration ---- */
  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem("your_theme");
      if (!stored) {
        const cookieTheme = document.cookie.match(/(?:^|;\s*)your_theme=([^;]+)/)?.[1] || null;
        stored = cookieTheme;
        if (stored) localStorage.setItem("your_theme", stored);
      }
    } catch {
      /* storage unavailable */
    }
    const next = stored || props.theme || "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
  }, [props.theme]);

  /* ---- rail open/closed (hidden by default) ---- */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("your_rail");
      if (stored === "open") setRailOpen(true);
      if (stored === "closed") setRailOpen(false);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleRail = () => {
    const next = !railOpen;
    setRailOpen(next);
    try { localStorage.setItem("your_rail", next ? "open" : "closed"); } catch { /* ignore */ }
  };

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = ["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName);
      if ((e.key === "/" && !typing) || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        setSearch(true);
      }
      if (e.key === "Escape") { setSearch(false); setOpen(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const hrefOf = (href: string) => (href === "/admin" ? "/admin" : `/${props.lang}${href === "/home" || href === "/" ? "" : href}`);

  const isActive = (href: string) => {
    const target = hrefOf(href);
    if (target === `/${props.lang}`) return pathname === target || pathname === `${target}/`;
    return pathname.startsWith(target);
  };

  const switchLang = async (code: string) => {
    await setCookie("your_lang", code);
    const rest = pathname.replace(new RegExp(`^/${props.lang}`), "") || "";
    router.push(`/${code}${rest}`);
    router.refresh();
  };

  const switchTheme = async () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("your_theme", next); } catch { /* ignore */ }
    await setCookie("your_theme", next);
  };

  const groups = props.railNav.reduce<Record<string, NavItem[]>>((acc, item) => {
    const key = item.group || "—";
    (acc[key] ||= []).push(item);
    return acc;
  }, {});

  return (
    <>
      <div className="prog" style={{ width: `${progress}%` }} aria-hidden />
      <div className="app-shell" data-rail={railOpen ? "open" : "closed"}>
        <nav className="rail" data-open={open} aria-label="Seções">
          <Link href={`/${props.lang}`} className="rail-logo" onClick={() => setOpen(false)}>
            {props.logo ? <img src={props.logo} alt={props.brand} className="rail-logo-img" /> : <b>{props.brand}</b>}
            {props.slogan ? <span>{props.slogan}</span> : null}
          </Link>

          {Object.entries(groups).map(([group, list]) => (
            <div key={group}>
              {group !== "—" && <h5>{group}</h5>}
              {list.map((item) => (
                <Link key={item.href} href={hrefOf(item.href)} className="fl" data-on={isActive(item.href)} onClick={() => setOpen(false)}>
                  <Icon value={item.icon} />
                  <span>{item.label}</span>
                  {item.badge ? <small>{item.badge}</small> : null}
                </Link>
              ))}
            </div>
          ))}

          <div className="mt-auto pt-4">
            <h5>Idioma / Language</h5>
            <div className="flex flex-wrap gap-1.5">
              {props.langs.map((l) => (
                <button key={l.code} className="chip" data-on={l.code === props.lang} onClick={() => switchLang(l.code)} title={l.nativeName}>
                  {l.flag} {l.code.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </nav>

        {open && <div className="fixed inset-0 z-[65] bg-black/60" onClick={() => setOpen(false)} aria-hidden />}

        <div className="min-w-0">
          <header className="hud">
            <button className="chip burger" onClick={() => setOpen(true)} aria-label="Abrir menu">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>
            <button className="chip rail-toggle" onClick={toggleRail} aria-pressed={railOpen} aria-label={railOpen ? "Ocultar menu lateral" : "Mostrar menu lateral"}>
              {railOpen ? "⟨ Ocultar menu" : "⟩ Mostrar menu"}
            </button>
            <Link href={`/${props.lang}`} className="hud-logo">
              {props.logo ? <img src={props.logo} alt={props.brand} className="hud-logo-img" /> : props.brand}
            </Link>

            <div className="hidden flex-1 flex-wrap gap-1.5 md:flex">
              {props.topNav.map((item) => (
                <Link key={item.href} href={hrefOf(item.href)} className="chip" data-on={isActive(item.href)}>
                  {item.label}
                </Link>
              ))}
            </div>

            <button className="chip" onClick={() => setSearch(true)} aria-label="Buscar">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <circle cx="10.5" cy="10.5" r="6.5" /><line x1="20" y1="20" x2="15.3" y2="15.3" />
              </svg>
            </button>
            <button className="chip" onClick={switchTheme} aria-label="Trocar tema" title="Trocar tema">
              {theme === "dark" ? (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="4.5" /><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" strokeLinecap="round" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 14.5A8.5 8.5 0 019.5 4a8.5 8.5 0 105 11.4c1.9-.2 3.9-.6 5.5-1.9z" /></svg>
              )}
            </button>
            <div className="flex gap-1 md:hidden">
              {props.langs.map((l) => (
                <button key={l.code} className="chip" data-on={l.code === props.lang} onClick={() => switchLang(l.code)}>{l.code.toUpperCase()}</button>
              ))}
            </div>
            <Link href="/admin" className="btn btn-gold hidden sm:inline-flex" title="Painel de edição">Admin</Link>
          </header>

          <main key={pathname} className="view rise">{props.children}</main>

          <footer className="border-t border-line px-5 py-10">
            <div className="mx-auto grid max-w-[1320px] gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
              <div>
                {props.logo ? <img src={props.logo} alt={props.brand} className="footer-logo-img" /> : <b className="font-logo text-3xl lowercase">{props.brand}</b>}
                <p className="mt-4 max-w-sm text-sm text-mute">{props.footerText}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {props.social.map((s) => (
                    <a key={s.label} href={s.url} target="_blank" rel="noreferrer" className="chip">{s.label}</a>
                  ))}
                </div>
              </div>
              {["Institucional", "Legal"].map((group) => {
                const list = props.footerNav.filter((f) => f.group === group);
                if (!list.length) return null;
                return (
                  <div key={group}>
                    <h5 className="mb-3 font-display text-[11px] font-semibold uppercase tracking-[.22em] text-mute">{group}</h5>
                    <ul className="grid gap-2">
                      {list.map((f) => (
                        <li key={f.href}>
                          <Link href={`/${props.lang}${f.href}`} className="text-sm hover:text-blush">{f.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </footer>
        </div>
      </div>

      {search && <SearchOverlay lang={props.lang} quick={props.topNav} onClose={() => setSearch(false)} />}
    </>
  );
}
