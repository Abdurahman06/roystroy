"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { Phone, Menu, X, Compass, ArrowRight } from "lucide-react";
import { COMPANY } from "@/lib/company";

interface HeaderProps {
  onOpenConsultation: () => void;
}

const NAV_LINKS = [
  { href: "#projects", label: "Проекты" },
  { href: "#3d-explorer", label: "3D-Эксплорер", icon: true },
  { href: "#engineering", label: "Технологии" },
  { href: "#calculator", label: "Калькулятор сметы" },
  { href: "#crimea-map", label: "Объекты в Крыму" },
  { href: "#instagram", label: "Блог" },
];

export default function Header({ onOpenConsultation }: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        className={`header-enter fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled
            ? "bg-[#e8e6e1]/95 backdrop-blur-2xl border-b border-black/10 shadow-lg shadow-black/10"
            : "bg-[#e8e6e1]/86 backdrop-blur-xl border-b border-black/5"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between h-20 lg:h-24 gap-8">

            {/* ── Logo ── */}
            <a href="#" aria-label="Ройстрой — на главную" className="flex-shrink-0 group">
              <Image
                src="/logo-dark.png"
                alt="Ройстрой"
                width={190}
                height={59}
                priority
                className="h-auto w-[150px] lg:w-[190px] object-contain transition-opacity duration-300 group-hover:opacity-65"
              />
            </a>

            {/* ── Desktop Navigation ── */}
            <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="flex items-center gap-1.5 text-sm font-medium text-[#202428]/70 hover:text-[#202428] transition-colors duration-200 whitespace-nowrap relative py-1 group"
                >
                  {link.icon && <Compass className="w-3.5 h-3.5 text-[#8E9BA8]" />}
                  <span>{link.label}</span>
                  <span className="absolute bottom-0 left-0 w-0 h-px bg-[#202428]/60 group-hover:w-full transition-all duration-300" />
                </a>
              ))}
            </nav>

            {/* ── Right: Phone + CTA ── */}
            <div className="hidden lg:flex items-center gap-6 flex-shrink-0">
              <a
                href={COMPANY.phonePrimaryHref}
                className="flex flex-col items-end group"
              >
                <span className="text-[11px] text-[#202428]/50 font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Прямая линия
                </span>
                <span className="text-sm font-semibold text-[#202428] group-hover:text-[#6B7A87] transition-colors">
                  {COMPANY.phonePrimary}
                </span>
              </a>

              <button
                onClick={onOpenConsultation}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#202428] text-white text-xs font-bold uppercase tracking-widest hover:bg-[#3b444b] transition-colors duration-200 shadow-lg shadow-black/10"
              >
                <span>Консультация</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* ── Mobile: compact CTA + burger ── */}
            <div className="lg:hidden flex items-center gap-3">
              <button
                onClick={onOpenConsultation}
                className="px-4 py-2 rounded-lg bg-[#202428] text-white text-xs font-bold uppercase tracking-wide"
              >
                Заявка
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#202428]/70 hover:text-[#202428] transition-colors"
                aria-label="Открыть меню"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ── Mobile Drawer ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-[#e8e6e1]/98 backdrop-blur-2xl flex flex-col pt-24 px-6 pb-8 lg:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 py-4 text-base font-medium text-[#202428]/80 hover:text-[#202428] border-b border-black/10 transition-colors"
              >
                {link.icon && <Compass className="w-4 h-4 text-[#8E9BA8]" />}
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-auto pt-8 border-t border-white/10 flex flex-col gap-4">
            <a
              href={COMPANY.phonePrimaryHref}
              className="flex items-center gap-3 text-[#202428]"
            >
              <div className="w-10 h-10 rounded-lg bg-black/5 border border-black/10 flex items-center justify-center">
                <Phone className="w-5 h-5 text-[#6B7A87]" />
              </div>
              <div>
                <p className="text-[11px] text-[#202428]/50">Прямая линия:</p>
                <p className="text-sm font-semibold">{COMPANY.phonePrimary}</p>
              </div>
            </a>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenConsultation(); }}
              className="w-full py-4 rounded-xl bg-[#202428] text-white font-bold uppercase tracking-widest text-sm"
            >
              Заказать расчет проекта
            </button>
          </div>
        </div>
      )}
    </>
  );
}
