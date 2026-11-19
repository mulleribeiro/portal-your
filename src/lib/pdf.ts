import embeddedLogo from "./pdf-logo.json";

/**
 * Minimal dependency-free PDF writer used by the press releases and the media kit.
 * Produces A4 pages with WinAnsi-encoded Helvetica and an optional JPEG logo.
 */

const WIN_ANSI_MAP: Record<number, number> = {
  0x20ac: 128, 0x201a: 130, 0x0192: 131, 0x201e: 132, 0x2026: 133, 0x2020: 134, 0x2021: 135,
  0x02c6: 136, 0x2030: 137, 0x0160: 138, 0x2039: 139, 0x0152: 140, 0x017d: 142, 0x2018: 145,
  0x2019: 146, 0x201c: 147, 0x201d: 148, 0x2022: 149, 0x2013: 150, 0x2014: 151, 0x02dc: 152,
  0x2122: 153, 0x0161: 154, 0x203a: 155, 0x0153: 156, 0x017e: 158, 0x0178: 159,
};

export function pdfString(input: string): string {
  let out = "(";
  for (let i = 0; i < input.length; i++) {
    const code = input.charCodeAt(i);
    let byte = 32;
    if (code >= 32 && code <= 126) byte = code;
    else if (code >= 160 && code <= 255) byte = code;
    else if (WIN_ANSI_MAP[code]) byte = WIN_ANSI_MAP[code];
    else continue;

    if (byte === 40 || byte === 41 || byte === 92) out += "\\" + String.fromCharCode(byte);
    else if (byte < 32 || byte > 126) out += "\\" + byte.toString(8).padStart(3, "0");
    else out += String.fromCharCode(byte);
  }
  return out + ")";
}

export function wrapText(text: string, maxChars: number): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

type LineItem = { kind: "h2" | "body" | "quote"; text: string };

export type PdfDoc = {
  kicker: string;
  title: string;
  dek: string;
  body: string;
  logoBytes: Buffer | null;
  footer?: string;
};

const PAGE_W = 595.28;
const PAGE_H = 841.89;
const MARGIN_X = 48;

export function buildPdf(opts: PdfDoc): Buffer {
  const bodyBlocks: LineItem[] = [];
  for (const raw of opts.body.split(/\n{1,}/)) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("[")) continue;
    if (trimmed.startsWith("## ") || trimmed.startsWith("# ")) {
      const h = trimmed.replace(/^#+\s*/, "");
      for (const l of wrapText(h.toUpperCase(), 68)) bodyBlocks.push({ kind: "h2", text: l });
    } else if (trimmed.startsWith("> ")) {
      for (const l of wrapText(`\u201c${trimmed.slice(2)}\u201d`, 82)) bodyBlocks.push({ kind: "quote", text: l });
    } else {
      for (const l of wrapText(trimmed, 88)) bodyBlocks.push({ kind: "body", text: l });
      bodyBlocks.push({ kind: "body", text: "" });
    }
  }

  const pagesStream: string[] = [];
  let cursor = 0;
  let pageNum = 1;

  while (cursor < bodyBlocks.length || pageNum === 1) {
    const cmds: string[] = [];

    if (pageNum === 1) {
      cmds.push("0.227 0.043 0.110 rg");
      cmds.push(`0 ${PAGE_H - 92} ${PAGE_W} 92 re f`);
      cmds.push("0.851 0.698 0.416 rg");
      cmds.push(`0 ${PAGE_H - 95} ${PAGE_W} 3 re f`);

      if (opts.logoBytes) {
        cmds.push("q");
        cmds.push(`155 0 0 37.5 ${MARGIN_X} ${PAGE_H - 66} cm`);
        cmds.push("/ImLogo Do");
        cmds.push("Q");
      } else {
        cmds.push("BT /F2 22 Tf 0.969 0.933 0.941 rg");
        cmds.push(`${MARGIN_X} ${PAGE_H - 54} Td ${pdfString("your \u00b7 10 ANOS")} Tj ET`);
      }

      cmds.push("BT /F2 9 Tf 0.914 0.655 0.722 rg");
      cmds.push(`${PAGE_W - 210} ${PAGE_H - 46} Td ${pdfString((opts.kicker || "YOUR MAGAZINE").toUpperCase())} Tj ET`);
      cmds.push("BT /F1 8.5 Tf 0.851 0.698 0.416 rg");
      cmds.push(`${PAGE_W - 210} ${PAGE_H - 60} Td ${pdfString("muller@yourmagazine.com.br")} Tj ET`);

      let y = PAGE_H - 126;

      if (opts.kicker) {
        cmds.push("BT /F2 9.5 Tf 0.55 0.11 0.27 rg");
        cmds.push(`${MARGIN_X} ${y} Td ${pdfString(opts.kicker.toUpperCase())} Tj ET`);
        y -= 20;
      }

      cmds.push("0.14 0.06 0.10 rg");
      for (const tl of wrapText(opts.title, 52)) {
        cmds.push(`BT /F2 17 Tf ${MARGIN_X} ${y} Td ${pdfString(tl)} Tj ET`);
        y -= 21;
      }

      if (opts.dek) {
        y -= 3;
        cmds.push("0.34 0.22 0.27 rg");
        for (const dl of wrapText(opts.dek, 78)) {
          cmds.push(`BT /F3 11 Tf ${MARGIN_X} ${y} Td ${pdfString(dl)} Tj ET`);
          y -= 15;
        }
      }

      y -= 8;
      cmds.push("0.85 0.75 0.78 RG 0.8 w");
      cmds.push(`${MARGIN_X} ${y} m ${PAGE_W - MARGIN_X} ${y} l S`);
      y -= 18;

      while (cursor < bodyBlocks.length && y > 64) {
        const item = bodyBlocks[cursor++];
        if (!item.text) { y -= 7; continue; }
        if (item.kind === "h2") {
          y -= 5;
          cmds.push(`BT /F2 11 Tf 0.36 0.09 0.20 rg ${MARGIN_X} ${y} Td ${pdfString(item.text)} Tj ET`);
          y -= 15;
        } else if (item.kind === "quote") {
          cmds.push(`BT /F3 10.5 Tf 0.36 0.09 0.20 rg ${MARGIN_X + 10} ${y} Td ${pdfString(item.text)} Tj ET`);
          y -= 14;
        } else {
          cmds.push(`BT /F1 10.2 Tf 0.14 0.06 0.10 rg ${MARGIN_X} ${y} Td ${pdfString(item.text)} Tj ET`);
          y -= 13.8;
        }
      }
    } else {
      cmds.push("0.227 0.043 0.110 rg");
      cmds.push(`0 ${PAGE_H - 42} ${PAGE_W} 42 re f`);
      cmds.push("BT /F2 9 Tf 0.969 0.933 0.941 rg");
      cmds.push(`${MARGIN_X} ${PAGE_H - 26} Td ${pdfString("YOUR MAGAZINE \u00b7 10 ANOS")} Tj ET`);

      let y = PAGE_H - 72;
      while (cursor < bodyBlocks.length && y > 64) {
        const item = bodyBlocks[cursor++];
        if (!item.text) { y -= 7; continue; }
        if (item.kind === "h2") {
          y -= 5;
          cmds.push(`BT /F2 11 Tf 0.36 0.09 0.20 rg ${MARGIN_X} ${y} Td ${pdfString(item.text)} Tj ET`);
          y -= 15;
        } else if (item.kind === "quote") {
          cmds.push(`BT /F3 10.5 Tf 0.36 0.09 0.20 rg ${MARGIN_X + 10} ${y} Td ${pdfString(item.text)} Tj ET`);
          y -= 14;
        } else {
          cmds.push(`BT /F1 10.2 Tf 0.14 0.06 0.10 rg ${MARGIN_X} ${y} Td ${pdfString(item.text)} Tj ET`);
          y -= 13.8;
        }
      }
    }

    cmds.push("0.55 0.42 0.46 rg");
    const footer = opts.footer || "YOUR Magazine \u2014 Feita no Brasil para o mundo, h\u00e1 10 anos";
    cmds.push(`BT /F1 8.5 Tf ${MARGIN_X} 32 Td ${pdfString(`${footer} \u00b7 P\u00e1gina ${pageNum}`)} Tj ET`);

    pagesStream.push(cmds.join("\n"));
    pageNum++;
    if (pageNum > 8) break;
  }

  const objects: Buffer[] = [];
  const addObj = (content: string | Buffer) => {
    objects.push(typeof content === "string" ? Buffer.from(content, "binary") : content);
    return objects.length;
  };

  const fontRegular = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>");
  const fontBold = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>");
  const fontItalic = addObj("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>");

  let logoObjId = 0;
  if (opts.logoBytes) {
    const header = Buffer.from(
      `<< /Type /XObject /Subtype /Image /Width 860 /Height 208 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${opts.logoBytes.length} >>\nstream\n`,
      "binary",
    );
    const footer = Buffer.from("\nendstream", "binary");
    logoObjId = addObj(Buffer.concat([header, opts.logoBytes, footer]));
  }

  const contentObjIds = pagesStream.map((stream) =>
    addObj(`<< /Length ${Buffer.byteLength(stream, "binary")} >>\nstream\n${stream}\nendstream`),
  );

  const pageObjIds = contentObjIds.map((cid) =>
    addObj(
      `<< /Type /Page /Parent PAGES 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R /F3 ${fontItalic} 0 R >> ${
        logoObjId ? `/XObject << /ImLogo ${logoObjId} 0 R >>` : ""
      } >> /Contents ${cid} 0 R >>`,
    ),
  );

  const kids = pageObjIds.map((id) => `${id} 0 R`).join(" ");
  const pagesTreeId = addObj(`<< /Type /Pages /Kids [${kids}] /Count ${pageObjIds.length} >>`);
  const catalogId = addObj(`<< /Type /Catalog /Pages ${pagesTreeId} 0 R >>`);
  for (const id of pageObjIds) {
    objects[id - 1] = Buffer.from(objects[id - 1].toString("binary").replace("/Parent PAGES", `/Parent ${pagesTreeId}`), "binary");
  }

  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n", "binary")];
  const offsets: number[] = [0];
  let offset = chunks[0].length;

  objects.forEach((obj, i) => {
    offsets.push(offset);
    const head = Buffer.from(`${i + 1} 0 obj\n`, "binary");
    const tail = Buffer.from("\nendobj\n", "binary");
    chunks.push(head, obj, tail);
    offset += head.length + obj.length + tail.length;
  });

  const xrefOffset = offset;
  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i <= objects.length; i++) {
    xref += `${offsets[i].toString().padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  chunks.push(Buffer.from(xref, "binary"));

  return Buffer.concat(chunks);
}

/** Embedded JPEG works on both Node.js and Workers (no filesystem dependency). */
export function logoBytes(): Buffer | null {
  return Buffer.from(embeddedLogo.base64, "base64");
}
