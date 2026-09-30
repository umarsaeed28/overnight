"use client";

import { useEffect, useState } from "react";
import { DemoButton } from "./DemoButton";
import { EnsoMoon } from "./art/EnsoMoon";
import { Hanko } from "./art/Hanko";

const LINKS = [
  { href: "#how", label: "How it works" },
  { href: "#why", label: "Why us" },
  { href: "#faq", label: "FAQ" },
];

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-white/80 backdrop-blur-md" : "bg-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-20 max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <a href="#top" className="flex items-center gap-2.5 rounded-full">
          <EnsoMoon className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
          <span className="whitespace-nowrap font-heading text-[18px] tracking-tight text-ink sm:text-[19px]">
            Overnight QA
          </span>
          {/* Dropped on the narrowest screens, where the row has no slack. */}
          <span className="hidden sm:block">
            <Hanko kanji="夜" className="h-7 w-7 text-[13px]" />
          </span>
        </a>

        <ul className="hidden items-center gap-9 md:flex">
          {LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-full text-[16px] text-softink transition-colors hover:text-ink"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-expanded={menuOpen}
            aria-controls="nav-sheet"
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-full p-2 text-ink md:hidden"
          >
            <span className="sr-only">Menu</span>
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden focusable="false">
              <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <path d="M4 8h16" />
                <path d="M4 16h16" />
              </g>
            </svg>
          </button>

          <DemoButton className="whitespace-nowrap px-4 py-2.5 text-[14px] sm:px-5 sm:text-[15px]">
            Book a demo
          </DemoButton>
        </div>
      </nav>

      {menuOpen ? (
        <div id="nav-sheet" className="border-t border-ink/10 bg-white/95 backdrop-blur-md md:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col px-5 py-2">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-2xl px-2 py-3.5 text-[17px] text-ink"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </header>
  );
}
