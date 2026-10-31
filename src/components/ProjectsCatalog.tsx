"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bath,
  BedDouble,
  Building2,
  CheckCircle2,
  FileText,
  House,
  Layers3,
  MapPin,
  Mountain,
  Ruler,
  X,
  type LucideIcon,
} from "lucide-react";
import filterStyles from "./ProjectFilters.module.css";

type ProjectCategory = "all" | "compact" | "private" | "complex";

export interface Project {
  id: string;
  title: string;
  category: Exclude<ProjectCategory, "all">;
  location: string;
  area: string;
  floors: string;
  rooms: string;
  wetRooms: string;
  estimate: string;
  duration: string;
  image: string;
  description: string;
  features: string[];
  steps: string[];
}

const PROJECTS_DATA: Project[] = [
  {
    id: "mirnoe-house",
    title: "Частный дом в с. Мирное",
    category: "private",
    location: "Симферопольский район",
    area: "индивидуально",
    floors: "1-2 этажа",
    rooms: "по ТЗ",
    wetRooms: "по проекту",
    estimate: "смета после проекта",
    duration: "фиксируется в договоре",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
    description:
      "Реальный объект из портфолио компании. На сайте он работает как честный пример частного строительства: не выдуманная вилла с красивым названием, а понятная история про дом, смету, этапы и контроль качества.",
    features: [
      "Проектирование и строительство под задачи семьи",
      "Фиксация стоимости и сроков в договоре",
      "Фото- и видеоотчеты по ходу работ",
      "Контроль скрытых работ до закрытия конструкций",
      "Работа по строительным нормам и проектной документации",
    ],
    steps: [
      "До стройки: выезд, ТЗ, проект, смета и календарный график.",
      "Во время стройки: этапная приемка, фотофиксация и документы по скрытым работам.",
    ],
  },
  {
    id: "sun-valley-house",
    title: "Дом в Солнечной долине",
    category: "complex",
    location: "Судакский район",
    area: "под участок",
    floors: "1-2 этажа",
    rooms: "по ТЗ",
    wetRooms: "по проекту",
    estimate: "после обследования",
    duration: "по графику работ",
    image: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80",
    description:
      "Крымский участок почти всегда диктует конструктив: грунты, уклон, ветровые нагрузки, солнце и логистика материалов. Такой кейс показывает инженерный подход компании лучше, чем абстрактные обещания премиума.",
    features: [
      "Адаптация проекта к рельефу и ориентации участка",
      "Расчет фундамента под фактические грунты",
      "Подбор материалов под климат и бюджет",
      "Планирование поставок без простоев",
      "Согласование ключевых решений до выхода на объект",
    ],
    steps: [
      "Обследование участка и уточнение ограничений до финальной сметы.",
      "Строительство по этапам: нулевой цикл, коробка, кровля, инженерия, отделка.",
    ],
  },
  {
    id: "tsn-mechta",
    title: "Дом в ТСН «Мечта»",
    category: "compact",
    location: "Крым",
    area: "компактный формат",
    floors: "1-2 этажа",
    rooms: "2-4",
    wetRooms: "1-2",
    estimate: "индивидуально",
    duration: "по договору",
    image: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=1200&q=80",
    description:
      "Компактный дом должен быть не дешевым визуально, а рациональным: без лишнего метража, с нормальной инженерной базой, понятным бюджетом и удобной планировкой для постоянного проживания или отдыха.",
    features: [
      "Рациональная площадь без переплаты за лишний объем",
      "Смета под выбранный уровень комплектации",
      "Надежная коробка и инженерная база",
      "Контроль закупок и сроков поставки материалов",
      "Финальная приемка по этапам",
    ],
    steps: [
      "Фокус проекта: планировка, надежность и стоимость владения.",
      "Фокус стройки: сроки, закупки, качество узлов и приемка этапов.",
    ],
  },
  {
    id: "golubinka-commercial",
    title: "Коммерческий объект в Нижней Голубинке",
    category: "private",
    location: "Бахчисарайский район",
    area: "по назначению",
    floors: "по проекту",
    rooms: "-",
    wetRooms: "по нормам",
    estimate: "проектная смета",
    duration: "по графику работ",
    image: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80",
    description:
      "Для бизнеса особенно важны сроки, исполнительная документация и прогнозируемая стоимость. Коммерческий объект на сайте усиливает доверие: компания умеет работать не только с частными домами.",
    features: [
      "Календарный график и этапная оплата",
      "Работа с проектной и исполнительной документацией",
      "Контроль строительной готовности и скрытых работ",
      "Подбор решений под эксплуатационную нагрузку",
      "Организация стройплощадки и поставок",
    ],
    steps: [
      "До работ: смета, сроки, договор и организация площадки.",
      "После этапов: исполнительная документация и приемка.",
    ],
  },
];

const FILTERS: { value: ProjectCategory; label: string; icon: LucideIcon }[] = [
  { value: "all", label: "Все", icon: Layers3 },
  { value: "compact", label: "Компактные дома", icon: House },
  { value: "private", label: "Частные и коммерческие", icon: Building2 },
  { value: "complex", label: "Сложные участки", icon: Mountain },
];

interface ProjectsCatalogProps {
  onSelectProjectForEstimate: (projectName: string) => void;
}

export default function ProjectsCatalog({ onSelectProjectForEstimate }: ProjectsCatalogProps) {
  const [filter, setFilter] = useState<ProjectCategory>("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const filterRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const revealedProjectsRef = useRef(new Set<string>());

  useEffect(() => {
    const grid = gridRef.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!grid || reducedMotion.matches || !("IntersectionObserver" in window)) return;

    const cards = Array.from(grid.querySelectorAll<HTMLElement>("[data-project-id]"));
    const animations = new Map<HTMLElement, Animation>();
    const reveal = (card: HTMLElement, delay = 0, immediate = false) => {
      observer.unobserve(card);
      revealedProjectsRef.current.add(card.dataset.projectId!);
      if (!immediate && !animations.has(card)) {
        const animation = card.animate(
          [{ opacity: 0, transform: "translateY(28px)" }, { opacity: 1, transform: "none" }],
          { duration: 650, delay, easing: "cubic-bezier(0.22, 1, 0.36, 1)", fill: "backwards" },
        );
        animations.set(card, animation);
        animation.onfinish = () => {
          animation.cancel();
          animations.delete(card);
        };
      } else if (immediate) {
        animations.get(card)?.cancel();
        animations.delete(card);
      }
      card.style.removeProperty("opacity");
    };
    const observer = new IntersectionObserver((entries) => {
      const entering = entries.filter(entry => entry.isIntersecting);
      entering.sort((a, b) => cards.indexOf(a.target as HTMLElement) - cards.indexOf(b.target as HTMLElement));
      entering.forEach((entry, index) => reveal(entry.target as HTMLElement, index * 90));
    }, { threshold: 0.12, rootMargin: "0px 0px -24px 0px" });

    cards.forEach(card => {
      if (revealedProjectsRef.current.has(card.dataset.projectId!)) return;
      // Keep SSR/no-JS content visible; only arm the reveal after hydration.
      card.style.opacity = "0";
      observer.observe(card);
    });
    const handleFocus = (event: FocusEvent) => {
      const card = (event.target as HTMLElement).closest<HTMLElement>("[data-project-id]");
      if (card) reveal(card, 0, true);
    };
    const handleMotionChange = () => {
      if (reducedMotion.matches) cards.forEach(card => reveal(card, 0, true));
    };
    grid.addEventListener("focusin", handleFocus);
    reducedMotion.addEventListener("change", handleMotionChange);
    return () => {
      observer.disconnect();
      animations.forEach(animation => animation.cancel());
      cards.forEach(card => card.style.removeProperty("opacity"));
      grid.removeEventListener("focusin", handleFocus);
      reducedMotion.removeEventListener("change", handleMotionChange);
    };
  }, [filter]);

  const filteredProjects =
    filter === "all" ? PROJECTS_DATA : PROJECTS_DATA.filter((project) => project.category === filter);

  return (
    <section id="projects" className="concrete-section py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight">
              Реальные направления строительства
            </h2>
            <p className="text-slate-400 text-sm sm:text-base max-w-2xl mt-3">
              Раздел собран как витрина доверия: реальные локации из старого сайта, понятные типы объектов и акцент на процессе, смете и контроле качества.
            </p>
          </div>

        </div>

          <div role="tablist" aria-label="Категории проектов" className={filterStyles.filters}>
            {FILTERS.map((item, index) => {
              const Icon = item.icon;
              const count = PROJECTS_DATA.filter(project => item.value === "all" || project.category === item.value).length;
              return (
              <button
                key={item.value}
                ref={element => { filterRefs.current[index] = element; }}
                id={`project-filter-${item.value}`}
                type="button"
                role="tab"
                aria-selected={filter === item.value}
                aria-controls="project-results"
                tabIndex={filter === item.value ? 0 : -1}
                onClick={() => setFilter(item.value)}
                onKeyDown={event => {
                  let next: number;
                  if (event.key === "ArrowRight") next = (index + 1) % FILTERS.length;
                  else if (event.key === "ArrowLeft") next = (index - 1 + FILTERS.length) % FILTERS.length;
                  else if (event.key === "Home") next = 0;
                  else if (event.key === "End") next = FILTERS.length - 1;
                  else return;
                  event.preventDefault();
                  setFilter(FILTERS[next].value);
                  filterRefs.current[next]?.focus();
                }}
                className={filterStyles.key}
              >
                <span className={filterStyles.top} aria-hidden="true">
                  <Icon size={16} strokeWidth={1.5} />
                  <span className={filterStyles.count}>{count}</span>
                </span>
                <span className={filterStyles.label}>{item.label}</span>
                <span className={filterStyles.light} aria-hidden="true" />
              </button>
              );
            })}
          </div>

        <div ref={gridRef} id="project-results" role="tabpanel" aria-labelledby={`project-filter-${filter}`} tabIndex={0} className={`${filterStyles.panel} grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6`}>
          {filteredProjects.map((project) => (
            <article
              key={project.id}
              data-project-id={project.id}
              className="group rounded-2xl overflow-hidden bg-[#0d0d0d] border border-white/10 hover:border-[#8E9BA8]/50 transition-[border-color,box-shadow] duration-500 hover:shadow-2xl hover:shadow-[#8E9BA8]/10 flex flex-col"
            >
              <div className="relative aspect-[16/11] overflow-hidden">
                <img
                  src={project.image}
                  alt={project.title}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 brightness-90 group-hover:brightness-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-black/40" />
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-xs text-white">
                  <MapPin className="w-3.5 h-3.5 text-[#8E9BA8]" />
                  <span>{project.location}</span>
                </div>
              </div>

              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-[#8E9BA8] transition-colors">
                  {project.title}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-5 font-light">
                  {project.description}
                </p>

                <div className="grid grid-cols-2 gap-2 py-3 border-y border-white/10 text-xs text-slate-300 mb-5">
                  <div className="flex items-center gap-2">
                    <Ruler className="w-3.5 h-3.5 text-[#8E9BA8]" />
                    <span>{project.area}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-[#8E9BA8]" />
                    <span>{project.floors}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BedDouble className="w-3.5 h-3.5 text-[#8E9BA8]" />
                    <span>{project.rooms}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="w-3.5 h-3.5 text-[#8E9BA8]" />
                    <span>{project.wetRooms}</span>
                  </div>
                </div>

                <div className="mt-auto flex items-center gap-3">
                  <button
                    onClick={() => setSelectedProject(project)}
                    className="flex-1 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Подробнее</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onSelectProjectForEstimate(project.title)}
                    className="py-3 px-4 rounded-xl text-xs font-bold text-black bg-[#8E9BA8] hover:bg-[#C8D0D8] transition-colors"
                  >
                    Смета
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedProject && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
          <div className="relative w-full max-w-4xl bg-[#0d0d0d] border border-white/15 rounded-2xl overflow-hidden shadow-2xl my-auto">
            <div className="relative h-64 sm:h-80 w-full overflow-hidden">
              <img
                src={selectedProject.image}
                alt={selectedProject.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-[#0d0d0d]/40 to-black/60" />

              <button
                onClick={() => setSelectedProject(null)}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/60 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute bottom-6 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#8E9BA8] font-semibold mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedProject.location}</span>
                  </div>
                  <h3 className="font-serif text-3xl sm:text-4xl font-bold text-white">
                    {selectedProject.title}
                  </h3>
                </div>
                <div className="text-left sm:text-right">
                  <span className="block text-xs text-slate-400">Ориентир бюджета:</span>
                  <span className="text-xl font-bold text-silver-gradient font-serif">
                    {selectedProject.estimate}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                <div>
                  <span className="block text-[11px] text-slate-400">Формат</span>
                  <span className="text-sm font-bold text-white">{selectedProject.area}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Срок</span>
                  <span className="text-sm font-bold text-white">{selectedProject.duration}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Этажность</span>
                  <span className="text-sm font-bold text-[#8E9BA8]">{selectedProject.floors}</span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400">Помещения</span>
                  <span className="text-sm font-bold text-white">
                    {selectedProject.rooms} / {selectedProject.wetRooms}
                  </span>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#8E9BA8] mb-2">
                  Описание работ
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed font-light">
                  {selectedProject.description}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-[#8E9BA8] mb-3">
                  Что важно для заказчика
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedProject.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5 text-xs text-slate-200">
                      <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Как ведется работа
                </h4>
                {selectedProject.steps.map((step) => (
                  <p key={step} className="text-xs text-slate-200 font-medium">
                    {step}
                  </p>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <FileText className="w-4 h-4 text-[#8E9BA8]" />
                  <span>Для точной цены нужен проект, участок и выбранная комплектация.</span>
                </div>

                <button
                  onClick={() => {
                    const projectName = selectedProject.title;
                    setSelectedProject(null);
                    onSelectProjectForEstimate(projectName);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest text-[#0a0a0a] bg-gradient-to-r from-[#C8D0D8] to-[#8E9BA8] shadow-xl hover:shadow-[#8E9BA8]/30 transition-all text-center"
                >
                  Рассчитать похожий объект
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
