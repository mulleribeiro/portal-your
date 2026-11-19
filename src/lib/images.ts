/**
 * Normalises remote image URLs so cards load fast and keep the right crop.
 * Wix media URLs accept on-the-fly resize through the `/v1/fill/...` segment.
 */
export function sizedImage(src: string | null | undefined, width: number, height: number): string {
  if (!src) return "";
  const url = String(src).trim();
  if (!url) return "";

  // Wix static media: /media/<file>/v1/fill/w_1200,h_900,al_c,q_80/<file>
  if (url.includes("static.wixstatic.com/media/")) {
    const [base, rest] = url.split("/v1/");
    const file = base.split("/media/")[1] || "";
    const ext = file.split(".").pop() || "jpg";
    return `${base}/v1/fill/w_${Math.round(width)},h_${Math.round(height)},al_c,q_82/${file.replace(/\.(png|jpe?g|webp)$/i, `.${ext}`)}`;
  }

  // Pexels: swap the size query params
  if (url.includes("images.pexels.com/photos/")) {
    return url.replace(/[?&]w=\d+/, `&w=${Math.round(width)}`).replace(/[?&]h=\d+/, `&h=${Math.round(height)}`);
  }

  // YouTube: hqdefault/sddefault carry baked-in black bars — always use the 16:9 maxres still.
  const yt = url.match(/^(https?:\/\/i\.ytimg\.com\/vi\/[A-Za-z0-9_-]{11})\/(hqdefault|sddefault|mqdefault|default)\.jpg/);
  if (yt) return `${yt[1]}/maxresdefault.jpg`;

  return url;
}

export function ratioSize(ratio: string): { w: number; h: number } {
  switch (ratio) {
    case "r34": return { w: 640, h: 854 };
    case "r43": return { w: 860, h: 645 };
    case "r169": return { w: 960, h: 540 };
    case "r11": return { w: 640, h: 640 };
    default: return { w: 800, h: 800 };
  }
}
