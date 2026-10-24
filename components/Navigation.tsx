"use client";

import { useEffect, useRef, useState, type CSSProperties, type MouseEvent } from "react";
import { MQ, scrollToTarget, useMotion, whenMotionReady } from "@/lib/motion";
import DriverButton from "@/components/driver/DriverButton";
import { NAV_LINKS, SECTION_LINKS } from "@/lib/site";

const SECTION_IDS = SECTION_LINKS.map((l) => l.href.slice(1));

export default function Navigation() {
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);

  // Active-section marker. IntersectionObserver fires only on section changes,
  // so it never causes per-frame React renders.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) setActive(entry.target.id);
      },
      { rootMargin: "-48% 0px -50% 0px" },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Page-wide triggers ("max" = full scroll height) are created only once every
  // queued section has added its pin spacer. The entrance itself is CSS.
  useMotion(header, ({ q, ctx }) =>
    whenMotionReady(({ gsap, ScrollTrigger }) =>
      ctx.add(() => {
        gsap.fromTo(
          q("[data-progress]"),
          { scaleX: 0 },
          { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } },
        );
        ScrollTrigger.create({
          start: 80,
          end: "max",
          toggleClass: { targets: header.current!, className: "is-scrolled" },
        });
      }),
    ),
  );

  // Mobile menu: Escape closes, Tab is contained, focus moves into the panel
  // and back out again. Crossing into the desktop layout closes it, otherwise
  // the scroll lock would outlive the (now hidden) panel.
  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuPanel.current;
    const button = menuButton.current;
    panel?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
      if (e.key !== "Tab" || !panel || !button) return;
      const items = [button, ...panel.querySelectorAll<HTMLElement>("a")];
      const i = items.indexOf(document.activeElement as HTMLElement);
      const next = e.shiftKey ? (i <= 0 ? items.length - 1 : i - 1) : i === items.length - 1 ? 0 : i + 1;
      e.preventDefault();
      items[next].focus();
    };
    // Must match the lg: breakpoint at which the inline nav replaces the menu.
    const desktop = window.matchMedia(MQ.navInline);
    const onBreakpoint = () => desktop.matches && setMenuOpen(false);

    document.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onBreakpoint);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onBreakpoint);
      document.documentElement.style.overflow = "";
      if (!desktop.matches) button?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    // Wait a frame so the menu's scroll lock is released before scrolling.
    requestAnimationFrame(() => scrollToTarget(href));
  };

  const activeHref = `#${active}`;

  return (
    <header ref={header} className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden
        data-nav-bg
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/95 via-ink/70 to-transparent opacity-0 transition-opacity duration-700"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-paper/5">
        <div data-progress className="h-full origin-left bg-crimson" style={{ transform: "scaleX(0)" }} />
      </div>

      <nav aria-label="Primary" className="relative flex h-16 items-center justify-between px-[var(--gutter)] md:h-20">
        <a
          href="#home"
          onClick={(e) => go(e, "#home")}
          aria-label="FIZZ — back to top"
          className="flex gap-[0.55em] text-[0.95rem] font-medium tracking-[0.1em] text-paper"
        >
          {"FIZZ".split("").map((letter, i) => (
            <span key={i} data-intro="letter" className="inline-block" style={{ "--i": i } as CSSProperties}>
              {letter}
            </span>
          ))}
        </a>

        <ul className="hidden items-center gap-9 lg:flex xl:gap-12">
          {NAV_LINKS.map((link, i) => {
            const isActive = activeHref === link.href;
            return (
              <li key={link.href} data-intro="nav" style={{ "--i": i } as CSSProperties}>
                <a
                  href={link.href}
                  onClick={(e) => go(e, link.href)}
                  aria-current={isActive ? "location" : undefined}
                  className={`t-micro relative block py-2 transition-colors duration-500 hover:text-paper ${
                    isActive ? "text-paper" : "text-silver/60"
                  }`}
                >
                  {link.label}
                  <span
                    aria-hidden
                    className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-crimson transition-transform duration-700 ease-[var(--ease-cine)] ${
                      isActive ? "scale-x-100" : "scale-x-0"
                    }`}
                  />
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-3 sm:gap-5">
        {/* Driver HUD gauge (JS feature). Hidden while the mobile menu is open so
            the menu's focus loop stays self-contained. */}
        {!menuOpen && (
          <div data-intro="nav" style={{ "--i": 6 } as CSSProperties}>
            <DriverButton />
          </div>
        )}
        <a
          href="#gallery"
          onClick={(e) => go(e, "#gallery")}
          data-intro="nav"
          style={{ "--i": 5 } as CSSProperties}
          className="t-micro hidden items-center gap-3 rounded-full border border-paper/25 px-5 py-2.5 text-paper transition-colors duration-500 hover:border-crimson lg:inline-flex"
        >
          Explore <span aria-hidden>↗</span>
        </a>

        <button
          ref={menuButton}
          type="button"
          data-intro="nav"
          style={{ "--i": 1 } as CSSProperties}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="t-micro relative z-10 flex min-h-11 items-center gap-3 text-paper lg:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
          <span aria-hidden className="flex w-5 flex-col gap-[5px]">
            <span className={`h-px bg-paper transition-transform duration-500 ${menuOpen ? "translate-y-[3px] rotate-45" : ""}`} />
            <span className={`h-px bg-paper transition-transform duration-500 ${menuOpen ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </span>
        </button>
        </div>
      </nav>

      <div
        id="mobile-menu"
        ref={menuPanel}
        hidden={!menuOpen}
        className="fixed inset-0 overflow-y-auto bg-ink px-[var(--gutter)] pt-24 pb-10 lg:hidden"
      >
        <ul className="flex flex-col">
          {SECTION_LINKS.map((link, i) => (
            <li key={link.href} className="border-b border-paper/10">
              <a
                href={link.href}
                onClick={(e) => go(e, link.href)}
                aria-current={activeHref === link.href ? "location" : undefined}
                className="flex items-baseline gap-5 py-4 text-paper"
              >
                <span className="t-micro text-crimson">0{i + 1}</span>
                <span className="text-xl font-light uppercase tracking-[0.24em] min-[380px]:text-2xl">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="t-micro mt-10 text-muted">FIZZ — A new era begins</p>
      </div>
    </header>
  );
}
