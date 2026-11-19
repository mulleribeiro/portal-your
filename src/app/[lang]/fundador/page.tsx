import { FounderClient } from "@/components/FounderClient";
import { loadSite } from "@/lib/data";

export async function generateMetadata() {
  return {
    title: "Müller Ribeiro · O Fundador",
    description: "CEO, Editor-Chefe e Comunicólogo — fundador da YOUR Magazine.",
  };
}

export default async function FounderPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const site = await loadSite();
  const s = site.settings;
  const imgs = (s.images || {}) as Record<string, { url?: string }>;

  const portraitUrl = imgs.founderPortrait?.url || "/brand/muller-1.jpeg";
  const collageUrl = imgs.founderCollage?.url || "/brand/muller-0.jpeg";
  const signatureUrl = imgs.founderSignature?.url || "/brand/muller-2.png";

  return (
    <div className="pt-8">
      <FounderClient
        lang={lang}
        portraitUrl={portraitUrl}
        collageUrl={collageUrl}
        signatureUrl={signatureUrl}
        email={String(s.email || "muller@yourmagazine.com.br")}
      />
    </div>
  );
}
