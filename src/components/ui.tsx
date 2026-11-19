import Link from "next/link";
import { Editable, type EditTarget } from "./EditProvider";
import { EditableImage } from "./EditableImage";
import { ratioSize, sizedImage } from "@/lib/images";

const PAL = [
  ["#3A0B1C", "#C2486A"], ["#1B2A41", "#C98B5E"], ["#2B1337", "#E9A7B8"],
  ["#0F2E2B", "#D9B26A"], ["#43121F", "#F0C9A0"], ["#1A1A2E", "#B4536F"],
];

function hash(input: string) {
  let h = 0;
  for (const c of String(input)) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h;
}

export function gradientFor(id: string) {
  const h = hash(id);
  const [a, b] = PAL[h % PAL.length];
  return `radial-gradient(120% 90% at ${15 + (h % 70)}% ${h % 40}%, ${b}66, transparent 62%), linear-gradient(160deg, ${a}, #12060A)`;
}

/** Image tile with gradient fallback. Pass `edit` to let editors replace the picture on the live site. */
export function MediaTile({
  id, src, word, ratio = "r43", className = "", children, edit, linkUrl,
}: {
  id: string; src?: string | null; word?: string; ratio?: string; className?: string;
  children?: React.ReactNode; edit?: EditTarget; linkUrl?: string | null;
}) {
  const linkTarget = edit && edit.entity === "item" ? ({ entity: "item" as const, id: edit.id, field: "url", label: "Link do item" }) : undefined;
  const { w, h } = ratioSize(ratio);
  const optimized = sizedImage(src, w, h);
  return (
    <div className={`md ${ratio} ${className}`} style={{ background: gradientFor(id) }}>
      {word ? <span className="mdw">{word}</span> : null}
      {edit ? (
        <EditableImage target={edit} src={optimized} linkTarget={linkTarget} linkUrl={linkUrl} />
      ) : optimized ? (
        <img src={optimized} alt="" loading="lazy" />
      ) : null}
      {children}
    </div>
  );
}

export function SectionHead({
  title, kicker, href, hrefLabel, target, translations,
}: {
  title: string; kicker?: string; href?: string; hrefLabel?: string;
  target?: EditTarget; translations?: Record<string, string>;
}) {
  return (
    <div className="sh">
      <div>
        {kicker && <p className="eyebrow mb-2">{kicker}</p>}
        <h2>
          {target ? <Editable target={target} value={title} translations={translations} multiline={false} /> : title}
        </h2>
      </div>
      {href && <Link href={href} className="more">{hrefLabel || "Ver tudo"} →</Link>}
    </div>
  );
}

export function Stats({ items, light }: { items: { value: string; label: string }[]; light?: boolean }) {
  return (
    <div className={`grid gap-5 ${light ? "sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
      {items.map((s, i) => (
        <div className="stat" key={i}>
          <b>{s.value}</b>
          <span>{s.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Kin({ text, className = "" }: { text: string; className?: string }) {
  return (
    <span className={`kin ${className}`}>
      {String(text).split(" ").map((w, i) => (
        <span key={`${w}-${i}`}>
          <i style={{ ["--i" as string]: i }}>{w}</i>{" "}
        </span>
      ))}
    </span>
  );
}

/** Renders the lightweight markdown dialect used by the editorial bodies. */
export function RichBody({ text, light = false }: { text: string; light?: boolean }) {
  if (!text) return null;
  const blocks = String(text).split(/\n{1,}/).map((l) => l.trim()).filter(Boolean);
  const wrap = light ? "" : "text-paper";

  const inline = (line: string) =>
    line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
      if (part.startsWith("*") && part.endsWith("*")) return <em key={i}>{part.slice(1, -1)}</em>;
      return <span key={i}>{part}</span>;
    });

  return (
    <div className={wrap}>
      {blocks.map((line, i) => {
        if (line.startsWith("## ")) return <h2 key={i}>{inline(line.slice(3))}</h2>;
        if (line.startsWith("# ")) return <h2 key={i}>{inline(line.slice(2))}</h2>;
        if (line.startsWith("> ")) return <blockquote key={i}>{inline(line.slice(2))}</blockquote>;
        if (line.startsWith("[stats]")) {
          const stats = line.slice(7).split(";").map((s) => s.trim()).filter(Boolean).map((s) => {
            const [value, label] = s.split("|").map((x) => x.trim());
            return { value: value || "", label: label || "" };
          });
          return <div key={i} className="my-7"><Stats items={stats} /></div>;
        }
        if (line.startsWith("[img]")) {
          return <img key={i} src={line.slice(5).trim()} alt="" className="my-6 w-full rounded-xl object-cover" loading="lazy" />;
        }
        if (line.startsWith("[list]")) {
          const list = line.slice(6).split(";").map((s) => s.trim()).filter(Boolean);
          return <ul key={i} className="my-5 grid gap-2">{list.map((li, j) => <li key={j} className="flex gap-2"><span className="text-blush">◆</span><span>{inline(li)}</span></li>)}</ul>;
        }
        return <p key={i}>{inline(line)}</p>;
      })}
    </div>
  );
}

export function TypeBadge({ label }: { label: string }) {
  return <span className="tag">{label}</span>;
}
