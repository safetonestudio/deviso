"use client";
import { useState } from "react";
import Link from "next/link";

export function NavbarMobile() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/[0.06] transition-colors"
        onClick={() => setOpen(!open)}
        aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
        aria-expanded={open}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 5L15 15M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H17M3 10H17M3 14H17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 bg-[#0D0D0E]/95 backdrop-blur-xl border-b border-white/[0.06] shadow-2xl md:hidden z-50">
          <div className="px-4 py-4 flex flex-col gap-1">
            <a
              href="#fonctionnalites"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Fonctionnalités
            </a>
            <a
              href="#comment"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Comment ça marche
            </a>
            <a
              href="#tarifs"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Tarifs
            </a>
            <Link
              href="/blog"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Blog
            </Link>
            <div className="border-t border-white/[0.06] my-2" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-white hover:bg-white/[0.06] rounded-lg transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="mt-1 bg-white text-black text-sm font-semibold px-4 py-2.5 rounded-lg hover:bg-zinc-100 transition-colors text-center"
            >
              Essayer gratuitement
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
