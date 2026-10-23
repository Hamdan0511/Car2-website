"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { gsap, MQ, ScrollTrigger, scrollToTarget, useGSAP } from "@/lib/motion";
import { NAV_LINKS } from "@/lib/site";

const SECTION_IDS = ["home", "performance", "design", "technology", "engineering", "gallery", "redline"];

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

  useGSAP(
    () => {
      const q = gsap.utils.selector(header);

      // Absolute start/end values keep these triggers independent of pin order.
      gsap.fromTo(
        q("[data-progress]"),
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } },
      );
      ScrollTrigger.create({
        start: 80,
        end: "max",
        toggleClass: { targets: header.current, className: "is-scrolled" },
      });

      const mm = gsap.matchMedia();
      mm.add(MQ.motion, () => {
        gsap
          .timeline({ delay: 0.35, defaults: { ease: "expo.out", duration: 1.2 } })
          .fromTo(q("[data-brand-letter]"), { autoAlpha: 0, yPercent: 60 }, { autoAlpha: 1, yPercent: 0, stagger: 0.07 })
          .fromTo(q("[data-nav-item]"), { autoAlpha: 0, y: -10 }, { autoAlpha: 1, y: 0, stagger: 0.06 }, 0.5);
      });
    },
    { scope: header },
  );

  // Mobile menu: Escape closes, focus moves into the panel and back out again.
  useEffect(() => {
    if (!menuOpen) return;
    const panel = menuPanel.current;
    const button = menuButton.current;
    panel?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    document.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
      button?.focus({ preventScroll: true });
    };
  }, [menuOpen]);

  const go = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMenuOpen(false);
    // Wait a frame so the menu's scroll lock is released before scrolling.
    requestAnimationFrame(() => scrollToTarget(href));
  };

  const activeHref = `#${active === "engineering" ? "performance" : active === "redline" ? "gallery" : active}`;

  return (
    <header ref={header} className="fixed inset-x-0 top-0 z-50">
      <div
        aria-hidden
        data-nav-bg
        className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-ink/95 via-ink/70 to-transparent opacity-0 transition-opacity duration-700"
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-paper/5">
        <div data-progress className="h-full origin-left bg-crimson" />
      </div>

      <nav aria-label="Primary" className="relative flex h-16 items-center justify-between px-[var(--gutter)] md:h-20">
        <a
          href="#home"
          onClick={(e) => go(e, "#home")}
          aria-label="FIZZ — back to top"
          className="flex gap-[0.55em] text-[0.95rem] font-medium tracking-[0.1em] text-paper"
        >
          {"FIZZ".split("").map((letter, i) => (
            <span key={i} data-brand-letter data-intro className="inline-block">
              {letter}
            </span>
          ))}
        </a>

        <ul className="hidden items-center gap-9 lg:gap-12 md:flex">
          {NAV_LINKS.map((link) => {
            const isActive = activeHref === link.href;
            return (
              <li key={link.href} data-nav-item data-intro>
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

        <a
          href="#gallery"
          onClick={(e) => go(e, "#gallery")}
          data-nav-item
          data-intro
          className="t-micro hidden items-center gap-3 rounded-full border border-paper/25 px-5 py-2.5 text-paper transition-colors duration-500 hover:border-crimson md:inline-flex"
        >
          Explore <span aria-hidden>↗</span>
        </a>

        <button
          ref={menuButton}
          type="button"
          data-nav-item
          data-intro
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMenuOpen((v) => !v)}
          className="t-micro relative z-10 flex items-center gap-3 py-2 text-paper md:hidden"
        >
          {menuOpen ? "Close" : "Menu"}
          <span aria-hidden className="flex w-5 flex-col gap-[5px]">
            <span className={`h-px bg-paper transition-transform duration-500 ${menuOpen ? "translate-y-[3px] rotate-45" : ""}`} />
            <span className={`h-px bg-paper transition-transform duration-500 ${menuOpen ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </span>
        </button>
      </nav>

      <div
        id="mobile-menu"
        ref={menuPanel}
        hidden={!menuOpen}
        className="fixed inset-0 bg-ink px-[var(--gutter)] pt-28 md:hidden"
      >
        <ul className="flex flex-col">
          {NAV_LINKS.map((link, i) => (
            <li key={link.href} className="border-b border-paper/10">
              <a
                href={link.href}
                onClick={(e) => go(e, link.href)}
                aria-current={activeHref === link.href ? "location" : undefined}
                className="flex items-baseline gap-5 py-5 text-paper"
              >
                <span className="t-micro text-crimson">0{i + 1}</span>
                <span className="text-2xl font-light uppercase tracking-[0.24em]">{link.label}</span>
              </a>
            </li>
          ))}
        </ul>
        <p className="t-micro mt-10 text-muted">FIZZ — A new era begins</p>
      </div>
    </header>
  );
}
