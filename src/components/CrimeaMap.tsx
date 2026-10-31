"use client";

import React, { useCallback, useState } from "react";
import { MapPin, ArrowUpRight } from "lucide-react";
import CrimeaMapCanvas from "./CrimeaMapCanvas";
import styles from "./CrimeaMap.module.css";

interface LocationSpot {
  id: string;
  city: string;
  region: string;
  coords: { lat: number; lng: number }; // City centers, not private project addresses.
  label: string;
  highlightProject: {
    title: string;
    type: string;
    area: string;
    status: string;
    image: string;
    note: string;
  };
}

const CRIMEAN_SPOTS: LocationSpot[] = [
  {
    id: "yalta",
    city: "Большая Ялта",
    region: "Ливадия, Ореанда, мыс Сарыч",
    coords: { lat: 44.4952, lng: 34.1663 },
    label: "частные дома",
    highlightProject: {
      title: "Частные дома и коттеджи",
      type: "Проектирование и строительство",
      area: "по ТЗ",
      status: "направление работ",
      image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
      note: "Для Ялты и ЮБК особенно важны рельеф, подъезды, дренаж и корректная посадка дома на участке."
    }
  },
  {
    id: "sevastopol",
    city: "Севастополь",
    region: "Мыс Фиолент, Казачья, Лабораторное",
    coords: { lat: 44.6167, lng: 33.5254 },
    label: "частные дома",
    highlightProject: {
      title: "Загородные дома",
      type: "Индивидуальное строительство",
      area: "по проекту",
      status: "направление работ",
      image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80",
      note: "Для Севастополя и Фиолента важно заранее учитывать ветровые нагрузки, геологию и логистику материалов."
    }
  },
  {
    id: "foros",
    city: "Форос & Симеиз",
    region: "Предгорье Ай-Петри",
    coords: { lat: 44.392, lng: 33.7861 },
    label: "сложный рельеф",
    highlightProject: {
      title: "Дома на рельефе",
      type: "Фундаменты, подпорные решения, дренаж",
      area: "по расчету",
      status: "сложный участок",
      image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80",
      note: "На предгорных участках нельзя начинать со сметы «на глаз»: сначала геология, посадка и конструктив."
    }
  },
  {
    id: "alushta",
    city: "Алушта & Гурзуф",
    region: "Профессорский уголок, вид на Аю-Даг",
    coords: { lat: 44.6764, lng: 34.4103 },
    label: "частные дома",
    highlightProject: {
      title: "Дома для постоянного проживания",
      type: "Под ключ или по этапам",
      area: "по ТЗ",
      status: "направление работ",
      image: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80",
      note: "Проект должен учитывать не только вид и архитектуру, но и эксплуатацию дома круглый год."
    }
  },
  {
    id: "simferopol",
    city: "Симферополь",
    region: "Марьино, Фонтаны, пригород",
    coords: { lat: 44.9521, lng: 34.1024 },
    label: "реальные кейсы",
    highlightProject: {
      title: "Дом в с. Мирное",
      type: "Реальный объект из портфолио",
      area: "по проекту",
      status: "портфолио",
      image: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80",
      note: "Старый сайт компании показывает этот объект как один из примеров выполненных работ."
    }
  },
  {
    id: "sudak",
    city: "Судак & Новый Свет",
    region: "Мыс Меганом, долина Капсель",
    coords: { lat: 44.8509, lng: 34.9762 },
    label: "реальные кейсы",
    highlightProject: {
      title: "Дом в Солнечной долине",
      type: "Реальный объект из портфолио",
      area: "по проекту",
      status: "портфолио",
      image: "https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80",
      note: "Этот кейс лучше развивать реальными фотографиями, этапами стройки и отзывом заказчика."
    }
  }
];

export default function CrimeaMap() {
  const [selectedSpotId, setSelectedSpotId] = useState<string>("yalta");
  const [focusRequest, setFocusRequest] = useState(0);
  const selectSpot = useCallback((id: string) => {
    setSelectedSpotId(id);
    setFocusRequest(value => value + 1);
  }, []);

  const currentSpot = CRIMEAN_SPOTS.find((s) => s.id === selectedSpotId) || CRIMEAN_SPOTS[0];

  return (
    <section id="crimea-map" className="concrete-section py-24 relative border-t border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-14">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              География «Ройстрой» <br className="hidden sm:inline" />
              на карте Крыма
            </h2>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-md font-light">
            Симферополь, Севастополь и Южный берег. Частные дома на равнинных участках и сложном рельефе Крыма.
          </p>
        </div>

        {/* Map and Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 min-w-0">
            <CrimeaMapCanvas
              spots={CRIMEAN_SPOTS}
              selectedSpotId={selectedSpotId}
              focusRequest={focusRequest}
              onSelect={selectSpot}
            />
            <div className={styles.selector} role="group" aria-label="Города и районы">
              {CRIMEAN_SPOTS.map(spot => (
                <button
                  key={spot.id}
                  type="button"
                  aria-pressed={spot.id === selectedSpotId}
                  aria-controls="map-location-details"
                  onClick={() => selectSpot(spot.id)}
                >
                  {spot.city}
                </button>
              ))}
            </div>
            <p className={styles.mapNote}>Города и районы работы. Точные адреса объектов не указаны.</p>
          </div>

          {/* Selected Location Card Preview (5 cols) */}
          <div id="map-location-details" aria-live="polite" aria-atomic="true" className="lg:col-span-5 glass-panel rounded-3xl overflow-hidden border border-white/15 bg-[#0d0d0d] shadow-2xl flex flex-col justify-between">
            {/* Project Image */}
            <div className="relative aspect-[16/10] overflow-hidden">
              <img
                src={currentSpot.highlightProject.image}
                alt={currentSpot.highlightProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/40" />

              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-xs text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#8E9BA8]" />
                <span>{currentSpot.city} • {currentSpot.region}</span>
              </div>

              <div className="absolute bottom-4 right-4 px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold text-xs backdrop-blur-md">
                {currentSpot.highlightProject.status}
              </div>
            </div>

            {/* Content Details */}
            <div className="p-6 sm:p-8 space-y-5">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#8E9BA8] block mb-1">
                  Выбранное направление
                </span>
                <h3 className="font-serif text-2xl font-bold text-white mb-2">
                  {currentSpot.highlightProject.title}
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-light">
                  {currentSpot.highlightProject.note}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Тип конструкции:</span>
                  <span className="font-semibold text-white">{currentSpot.highlightProject.type}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Площадь:</span>
                  <span className="font-bold text-[#8E9BA8] text-sm">{currentSpot.highlightProject.area}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  Акцент: <strong className="text-white">{currentSpot.label}</strong>
                </span>
                <a
                  href="#projects"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8E9BA8] hover:text-[#C8D0D8] transition-colors"
                >
                  <span>Каталог проектов</span>
                  <ArrowUpRight className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
