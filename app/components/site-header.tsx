"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const navigation = [
  { href: "/catalog", label: "Каталог" },
  { href: "/supply", label: "Поставка" },
  { href: "/about", label: "О проекте" },
  { href: "/contacts", label: "Контакты" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const closeOnDesktop = () => { if (desktop.matches) setOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  return (
    <header className="site-header" onKeyDown={(event) => {
      if (open && event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        menuButton.current?.focus();
      }
    }} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
    }}>
      <div className="container header-inner">
        <a className="brand" href="/" title="На главную" onClick={() => setOpen(false)}>
          <span className="brand-mark" aria-hidden="true">EP</span>
          <span><strong>ExaPolymer</strong><small aria-hidden="true">Инженерные пластики</small></span>
        </a>

        <nav className="desktop-nav" aria-label="Основная навигация">
          {navigation.map((item) => <a href={item.href} key={item.href}>{item.label}</a>)}
        </nav>

        <div className="header-actions">
          <a className="button button-small button-dark desktop-request" href="/contacts">Рассчитать поставку</a>
          <a className="button button-small button-dark mobile-request" href="/contacts">Расчёт</a>
          <button
            ref={menuButton}
            className="mobile-menu-button"
            type="button"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      <nav id="mobile-navigation" className={`mobile-nav ${open ? "is-open" : ""}`} aria-label="Мобильная навигация">
        <div className="container">
          {navigation.map((item) => <a href={item.href} key={item.href} onClick={() => setOpen(false)}>{item.label}</a>)}
          <a className="button button-primary" href="/contacts" onClick={() => setOpen(false)}>Отправить ТЗ</a>
        </div>
      </nav>
    </header>
  );
}
