"use client";

import React, { useState, useEffect } from "react";
import { ArrowRight, Play, MapPin, Layers, Ruler } from "lucide-react";

interface HeroProps {
  onOpenConsultation: () => void;
  onNavigateTo3D: () => void;
}

const HERO_PROJECTS = [
  {
    id: "mirnoe",
    name: "Дом в с. Мирное",
    location: "Симферопольский район",
    area: "частный дом",
    seismic: "строительство по СП и ГОСТ",
    status: "реальный объект компании",
    bgImage: "https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=2000&q=85",
    quote: "Капитальная стройка без красивых обещаний на бумаге: проект, смета, объект и контроль этапов"
  },
  {
    id: "sun-valley",
    name: "Дом в Солнечной долине",
    location: "Судакский район",
    area: "загородный дом",
    seismic: "монолитные и каменные работы",
    status: "портфолио Ройстрой",
    bgImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85",
    quote: "Дом, который должен выдерживать климат, рельеф и ежедневную эксплуатацию, а не только хорошо смотреться на рендере"
  },
  {
    id: "commercial",
    name: "Коммерческий объект",
    location: "Нижняя Голубинка",
    area: "нежилое строительство",
    seismic: "инженерный контроль этапов",
    status: "реальный объект компании",
    bgImage: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2000&q=85",
    quote: "Для бизнеса особенно важны сроки, понятная смета и документы по каждому скрытому этапу работ"
  }
];

const STATS = [
  { value: "15+ лет", label: "опыта строительства на скальных грунтах Крыма" },
  { value: "СП/ГОСТ", label: "работа по строительным нормам и проектной документации" },
  { value: "Фикс сметы", label: "стоимость и сроки закрепляются в договоре" },
  { value: "Фотоотчеты", label: "контроль этапов, акты скрытых работ, связь с заказчиком" },
];

export default function Hero({ onOpenConsultation, onNavigateTo3D }: HeroProps) {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % HERO_PROJECTS.length), 8000);
    return () => clearInterval(t);
  }, []);

  const p = HERO_PROJECTS[activeIdx];

  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden bg-[#0a0a0a]">

      {/* ── Cinematic Background ── */}
      {HERO_PROJECTS.map((proj, idx) => (
        <div
          key={proj.id}
          className={`absolute inset-0 transition-opacity duration-1200 ease-in-out ${idx === activeIdx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
          style={{ transitionDuration: "1400ms" }}
        >
          <img
            src={proj.bgImage}
            alt={proj.name}
            className="w-full h-full object-cover object-center"
            style={{ filter: "brightness(0.35) contrast(1.1)" }}
          />
          {/* Multi-layer gradient for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/60 to-transparent" />
        </div>
      ))}

      {/* Subtle grid */}
      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-30" />

      {/* ── Main Content ── */}
      <div className="relative z-10 flex-1 flex flex-col justify-center max-w-7xl mx-auto w-full px-6 lg:px-10 pt-36 pb-16">

        {/* Status pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/5 border border-white/15 backdrop-blur-sm mb-8 w-fit">
          <span className="w-2 h-2 rounded-full bg-[#8E9BA8] animate-pulse" />
          <span className="text-xs uppercase tracking-[0.22em] font-semibold text-[#C8D0D8]">
            Строительная компания в Крыму · 15+ лет опыта
          </span>
        </div>

        {/* Headline */}
        <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tight max-w-4xl mb-6">
          Дома и коммерческие объекты<br />
          <span className="text-silver-gradient italic font-normal">под ключ</span>{" "}
          в Крыму
        </h1>

        <p className="text-white/60 text-base sm:text-lg max-w-2xl leading-relaxed mb-12 font-light">
          Никаких громких слов: проектируем, считаем смету, строим по СП и ГОСТ, фиксируем цену и сроки в договоре и показываем заказчику ход работ на каждом этапе.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-16">
          <button
            onClick={onOpenConsultation}
            className="flex items-center gap-2.5 px-8 py-4 rounded-xl bg-white text-[#0a0a0a] text-sm font-bold uppercase tracking-widest hover:bg-[#E8ECEF] transition-colors duration-200 shadow-xl group"
          >
            <span>Рассчитать смету</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </button>

          <button
            onClick={onNavigateTo3D}
            className="flex items-center gap-3 px-7 py-4 rounded-xl bg-white/5 border border-white/15 text-white text-sm font-medium hover:bg-white/10 hover:border-white/30 transition-all backdrop-blur-sm"
          >
            <div className="w-7 h-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
              <Play className="w-3 h-3 fill-white ml-0.5" />
            </div>
            <span>Посмотреть 3D-модель узлов</span>
          </button>
        </div>

        {/* Active project info card */}
        <div className="glass-panel rounded-2xl p-5 max-w-3xl border border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/8 pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-white/40 mb-1">
                <MapPin className="w-3.5 h-3.5 text-[#8E9BA8]" />
                <span>{p.location}</span>
                <span className="text-white/20">·</span>
                <span className="text-emerald-400 font-medium">{p.status}</span>
              </div>
              <h3 className="font-serif text-xl font-bold text-white">{p.name}</h3>
            </div>

            <div className="flex items-center gap-5 text-xs">
              <div>
                <span className="block text-[10px] text-white/35 uppercase tracking-wider">Площадь</span>
                <span className="font-bold text-white">{p.area}</span>
              </div>
              <div>
                <span className="block text-[10px] text-white/35 uppercase tracking-wider">Подход</span>
                <span className="font-bold text-[#C8D0D8]">{p.seismic}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-white/50 italic font-light">«{p.quote}»</p>

            {/* Slide dots */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {HERO_PROJECTS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === activeIdx ? "w-8 bg-white" : "w-1.5 bg-white/25 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Stats Bar ── */}
      <div className="relative z-10 w-full border-t border-white/8 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat) => (
              <div key={stat.value}>
                <div className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold text-grey-gradient mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-white/40 leading-snug">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
