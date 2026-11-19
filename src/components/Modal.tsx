"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Modal rendered in a portal attached to <body>, always centered in the viewport with scroll lock. */
export function Modal({
  open, onClose, labelledBy, children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy?: string;
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    html.classList.add("modal-open");
    html.style.top = `-${scrollY}px`;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      html.classList.remove("modal-open");
      html.style.top = "";
      window.scrollTo({ top: scrollY, behavior: "instant" as ScrollBehavior });
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
      {children}
    </div>,
    document.body,
  );
}
