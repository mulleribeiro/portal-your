"use client";

import { useMemo, useState } from "react";

/**
 * YouTube thumbnail that always fills its 16:9 frame.
 * `hqdefault` ships with baked-in black bars, so we start from the 16:9 variants
 * and degrade gracefully if a video has no HD still.
 */
export function VideoThumb({
  id, fallback, alt = "", className = "", priority = false,
}: { id: string; fallback?: string; alt?: string; className?: string; priority?: boolean }) {
  const sources = useMemo(() => {
    const list = [
      `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`,
      `https://i.ytimg.com/vi/${id}/sddefault.jpg`,
      `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
      fallback || "",
      `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    ].filter(Boolean);
    return [...new Set(list)];
  }, [id, fallback]);

  const [index, setIndex] = useState(0);
  const src = sources[Math.min(index, sources.length - 1)];

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setIndex((i) => (i < sources.length - 1 ? i + 1 : i))}
      className={`h-full w-full object-cover object-center ${className}`}
    />
  );
}
