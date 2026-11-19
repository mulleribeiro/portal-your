import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { ProjectDownload } from "@/components/ProjectDownload";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "YOUR", template: "%s · YOUR" },
  description:
    "Portal YOUR — revista, capas, edições, vídeos, coleções e assessoria de imprensa. Conteúdo 100% editável, multilíngue.",
};

export const viewport: Viewport = {
  themeColor: "#12060A",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const lang = store.get("your_lang")?.value || "pt";
  const theme = store.get("your_theme")?.value === "light" ? "light" : "dark";

  return (
    <html lang={lang} data-theme={theme}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800&family=Barlow:wght@400;500;600&family=Nunito:wght@900&family=Playfair+Display:ital,wght@1,400;1,500&family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}<ProjectDownload /></body>
    </html>
  );
}
