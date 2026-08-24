"use client";

import { X } from "lucide-react";
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from "react";

type Photo = { src: string; alt: string };
type LightboxApi = (photo: Photo) => void;

const LightboxContext = createContext<LightboxApi | null>(null);

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  const open = useCallback((next: Photo) => {
    /* запоминаем, откуда открыли, чтобы вернуть туда фокус при закрытии */
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    setPhoto(next);
  }, []);

  const close = useCallback(() => {
    setPhoto(null);
    returnFocusRef.current?.focus?.();
    returnFocusRef.current = null;
  }, []);

  useEffect(() => {
    if (!photo) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      /* пока окно открыто, Tab не должен уводить фокус на страницу под ним */
      if (event.key === "Tab") {
        event.preventDefault();
        closeRef.current?.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);

    /* фон не должен прокручиваться под открытым окном; компенсируем ширину
       полосы прокрутки, иначе страница дёргается вбок в момент открытия */
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const overflow = body.style.overflow;
    const padding = body.style.paddingRight;
    body.style.overflow = "hidden";
    if (gap > 0) body.style.paddingRight = `${gap}px`;

    closeRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      body.style.overflow = overflow;
      body.style.paddingRight = padding;
    };
  }, [photo, close]);

  return (
    <LightboxContext.Provider value={open}>
      {children}
      {photo && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={photo.alt || "Просмотр фотографии"}
          /* закрываем только по клику мимо самого снимка */
          onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
        >
          <button ref={closeRef} className="lightbox-close" type="button" onClick={close} aria-label="Закрыть просмотр">
            <X size={22} />
          </button>
          <img className="lightbox-image" src={photo.src} alt={photo.alt} />
          {photo.alt && <p className="lightbox-caption">{photo.alt}</p>}
        </div>
      )}
    </LightboxContext.Provider>
  );
}

type PhotoLinkProps = {
  src: string;
  alt: string;
  className?: string;
  children: ReactNode;
};

/* Остаётся обычной ссылкой на файл: средняя кнопка, Ctrl+клик и «открыть в
   новой вкладке» продолжают работать, перехватываем только обычный клик. */
export function PhotoLink({ src, alt, className, children }: PhotoLinkProps) {
  const open = useContext(LightboxContext);

  return (
    <a
      href={src}
      className={className}
      onClick={(event) => {
        if (!open || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
        event.preventDefault();
        open({ src, alt });
      }}
    >
      {children}
    </a>
  );
}
