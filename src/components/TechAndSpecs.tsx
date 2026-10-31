"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { 
  Truck, 
  Mountain, 
  FileCheck, 
  Activity, 
  HardHat, 
  CheckCircle2, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import styles from "./TechAndSpecs.module.css";

type EngineeringTab = "seismic" | "machinery" | "relief" | "gost";

export default function TechAndSpecs() {
  const [activeTab, setActiveTab] = useState<EngineeringTab>("seismic");
  const iconRefs = useRef<Record<EngineeringTab, HTMLSpanElement | null>>({
    seismic: null, machinery: null, relief: null, gost: null,
  });
  const animationsRef = useRef<Animation[]>([]);
  const cancelAnimations = useCallback(() => {
    animationsRef.current.forEach(animation => animation.cancel());
    animationsRef.current = [];
  }, []);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleMotionChange = () => { if (motion.matches) cancelAnimations(); };
    motion.addEventListener("change", handleMotionChange);
    return () => {
      motion.removeEventListener("change", handleMotionChange);
      cancelAnimations();
    };
  }, [cancelAnimations]);

  const selectTab = (tab: EngineeringTab) => {
    setActiveTab(tab);
    cancelAnimations();
    const icon = iconRefs.current[tab];
    if (!icon || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Track every moving part so rapid clicks, tab changes and unmounting
    // restore the original icons without leaving queued or partial animations.
    const animate = (target: Element, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const animation = target.animate(frames, options);
      animationsRef.current.push(animation);
      animation.onfinish = () => {
        animationsRef.current = animationsRef.current.filter(item => item !== animation);
        animation.cancel();
      };
    };

    if (tab === "seismic") {
      animate(icon, [
        { transform: "translateX(0)", offset: 0 },
        { transform: "translateX(-2px)", offset: .15 },
        { transform: "translateX(2.5px)", offset: .3 },
        { transform: "translateX(-2px)", offset: .45 },
        { transform: "translateX(1.5px)", offset: .6 },
        { transform: "translateX(-.5px)", offset: .8 },
        { transform: "translateX(0)", offset: 1 },
      ], { duration: 900, easing: "ease-in-out" });
      const wave = icon.querySelector("path");
      if (wave) {
        const length = wave.getTotalLength();
        animate(wave, [
          { strokeDasharray: `${length}`, strokeDashoffset: `${length}`, offset: 0 },
          { strokeDasharray: `${length}`, strokeDashoffset: "0", offset: .85 },
          { strokeDasharray: `${length}`, strokeDashoffset: "0", offset: 1 },
        ], { duration: 900, easing: "ease-in-out" });
      }
      return;
    }

    if (tab === "relief") {
      animate(icon, [
        { transform: "translateY(0) scale(1)", offset: 0 },
        { transform: "translateY(4px) scale(.96, .65)", offset: .16 },
        { transform: "translateY(-3px) scale(1.04, 1.12)", offset: .55 },
        { transform: "translateY(1px) scale(1, .97)", offset: .78 },
        { transform: "translateY(0) scale(1)", offset: 1 },
      ], { duration: 1000, easing: "cubic-bezier(.22, .61, .36, 1)" });
      return;
    }

    if (tab === "gost") {
      animate(icon, [
        { transform: "translateY(0) rotate(0deg) scale(1)", offset: 0 },
        { transform: "translateY(-2px) rotate(-8deg) scale(1)", offset: .2 },
        { transform: "translateY(0) rotate(0deg) scale(1)", offset: .45 },
        { transform: "translateY(0) rotate(0deg) scale(1.1)", offset: .75 },
        { transform: "translateY(0) rotate(0deg) scale(1)", offset: 1 },
      ], { duration: 1000, easing: "ease-in-out" });
      // FileCheck's final path is the checkmark; leave the page outline intact.
      const check = icon.querySelector("path:last-child");
      if (check instanceof SVGPathElement) {
        const length = check.getTotalLength();
        animate(check, [
          { strokeDasharray: `${length}`, strokeDashoffset: `${length}`, opacity: 0, offset: 0 },
          { strokeDasharray: `${length}`, strokeDashoffset: `${length}`, opacity: 1, offset: .3 },
          { strokeDasharray: `${length}`, strokeDashoffset: "0", opacity: 1, offset: .75 },
          { strokeDasharray: `${length}`, strokeDashoffset: "0", opacity: 1, offset: 1 },
        ], { duration: 1000, easing: "ease-in-out" });
      }
      return;
    }

    // Leave the badge to the right, then drive back in from the left.
    animate(icon, [
      { transform: "translate(0, 0) rotate(0deg)", opacity: 1, offset: 0 },
      { transform: "translate(-2px, 0) rotate(-3deg)", opacity: 1, offset: .12 },
      { transform: "translate(12px, -1px) rotate(1deg)", opacity: 1, offset: .3 },
      { transform: "translate(34px, 0) rotate(0deg)", opacity: 1, offset: .48 },
      { transform: "translate(34px, 0)", opacity: 0, offset: .49 },
      { transform: "translate(-34px, 0)", opacity: 0, offset: .5 },
      { transform: "translate(-34px, 0)", opacity: 1, offset: .51 },
      { transform: "translate(-8px, -1px) rotate(-1deg)", opacity: 1, offset: .78 },
      { transform: "translate(0, 0) rotate(0deg)", opacity: 1, offset: 1 },
    ], { duration: 1100, easing: "ease-in-out" });
  };

  return (
    <section id="engineering" className="concrete-section py-24 relative overflow-hidden border-t border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Почему строить в Крыму <br />
            доверяют именно «Ройстрой»
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light leading-relaxed">
            Специфика крымского полуострова не прощает дилетантства: грунты, уклоны, сейсмичность, ветер и логистика требуют проектного подхода, точной сметы и контроля этапов.
          </p>
        </div>

        {/* 4 Core Pillars Navigation */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-12" role="group" aria-label="Направления работы">
          <button
            type="button"
            id="engineering-tab-seismic"
            aria-pressed={activeTab === "seismic"}
            aria-controls="engineering-details"
            onClick={() => selectTab("seismic")}
            className={`${styles.tab} p-5 rounded-2xl border text-left transition-all duration-300 ${
              activeTab === "seismic"
                ? "bg-[#111111] border-[#8E9BA8] shadow-xl shadow-[#8E9BA8]/10"
                : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
            }`}
          >
            <div className={`${styles.iconWindow} w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              activeTab === "seismic" ? "bg-[#8E9BA8] text-black" : "bg-white/10 text-white"
            }`}>
              <span ref={node => { iconRefs.current.seismic = node; }} className={styles.icon} data-engineering-icon="seismic" aria-hidden="true">
                <Activity className="w-5 h-5" />
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold mb-1">
              Сейсмические требования
            </h3>
            <p className="text-xs">
              СП 14.13330 • расчет конструкций
            </p>
          </button>

          <button
            type="button"
            id="engineering-tab-machinery"
            aria-pressed={activeTab === "machinery"}
            aria-controls="engineering-details"
            onClick={() => selectTab("machinery")}
            className={`${styles.tab} p-5 rounded-2xl border text-left transition-all duration-300 ${
              activeTab === "machinery"
                ? "bg-[#111111] border-[#8E9BA8] shadow-xl shadow-[#8E9BA8]/10"
                : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
            }`}
          >
            <div className={`${styles.iconWindow} w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              activeTab === "machinery" ? "bg-[#8E9BA8] text-black" : "bg-white/10 text-white"
            }`}>
              <span ref={node => { iconRefs.current.machinery = node; }} className={styles.icon} data-engineering-icon="machinery" data-machinery-truck aria-hidden="true">
                <Truck className="w-5 h-5" />
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold mb-1">
              Парк спецтехники
            </h3>
            <p className="text-xs">
              Свои гидромолоты, экскаваторы, краны
            </p>
          </button>

          <button
            type="button"
            id="engineering-tab-relief"
            aria-pressed={activeTab === "relief"}
            aria-controls="engineering-details"
            onClick={() => selectTab("relief")}
            className={`${styles.tab} p-5 rounded-2xl border text-left transition-all duration-300 ${
              activeTab === "relief"
                ? "bg-[#111111] border-[#8E9BA8] shadow-xl shadow-[#8E9BA8]/10"
                : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
            }`}
          >
            <div className={`${styles.iconWindow} w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              activeTab === "relief" ? "bg-[#8E9BA8] text-black" : "bg-white/10 text-white"
            }`}>
              <span ref={node => { iconRefs.current.relief = node; }} className={styles.icon} data-engineering-icon="relief" aria-hidden="true">
                <Mountain className="w-5 h-5" />
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold mb-1">
              Сложный рельеф ЮБК
            </h3>
            <p className="text-xs">
              Уклоны, подпорные стены, дренаж
            </p>
          </button>

          <button
            type="button"
            id="engineering-tab-gost"
            aria-pressed={activeTab === "gost"}
            aria-controls="engineering-details"
            onClick={() => selectTab("gost")}
            className={`${styles.tab} p-5 rounded-2xl border text-left transition-all duration-300 ${
              activeTab === "gost"
                ? "bg-[#111111] border-[#8E9BA8] shadow-xl shadow-[#8E9BA8]/10"
                : "bg-white/5 border-white/10 hover:border-white/20 text-slate-300"
            }`}
          >
            <div className={`${styles.iconWindow} w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              activeTab === "gost" ? "bg-[#8E9BA8] text-black" : "bg-white/10 text-white"
            }`}>
              <span ref={node => { iconRefs.current.gost = node; }} className={styles.icon} data-engineering-icon="gost" aria-hidden="true">
                <FileCheck className="w-5 h-5" />
              </span>
            </div>
            <h3 className="font-serif text-base sm:text-lg font-bold mb-1">
              Фикс сметы и ГОСТ
            </h3>
            <p className="text-xs">
              Договор, смета и этапная приемка
            </p>
          </button>
        </div>

        {/* Tab Detail Showcase */}
        <div id="engineering-details" role="region" aria-labelledby={`engineering-tab-${activeTab}`} className="glass-panel rounded-3xl p-6 sm:p-10 border border-white/10 bg-gradient-to-br from-[#111111] via-[#090d16] to-[#0a0a0a]">
          {activeTab === "seismic" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E9BA8] mb-2 block">
                  Стандарты безопасности ЮБК
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                  Конструктив дома подбирается по участку, нормам и проектной документации
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                  Крым относится к территориям, где нельзя строить «по картинке». Несущая схема, фундамент, стены и узлы армирования должны соответствовать проекту, геологии участка и действующим строительным нормам.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-1" />
                    <p className="text-xs text-slate-200">
                      <strong>Проектный конструктив:</strong> фундамент, каркас и несущие элементы рассчитываются под грунты, этажность, нагрузки и выбранную технологию.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-1" />
                    <p className="text-xs text-slate-200">
                      <strong>Контроль скрытых работ:</strong> армирование, гидроизоляция и инженерные закладные фиксируются до заливки и закрытия конструкций.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-1" />
                    <p className="text-xs text-slate-200">
                      <strong>Материалы по смете:</strong> решения согласуются до закупки, чтобы заказчик понимал стоимость и состав работ.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1000&q=80"
                  alt="Монолитные работы в Крыму"
                  className="w-full h-full object-cover filter contrast-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-xs text-slate-300">
                  Визуальный пример монолитных работ. Реальные фото объектов лучше подключить из архива компании и Instagram.
                </div>
              </div>
            </div>
          )}

          {activeTab === "machinery" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E9BA8] mb-2 block">
                  Автономия и контроль сроков
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                  Собственный парк тяжелой строительной техники в Крыму
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                  Строительство в Крыму часто упирается не только в проект, но и в организацию площадки: подъезд, земляные работы, вывоз грунта, поставки материалов и работа на ограниченном пространстве. На сайте этот блок должен показывать управляемость процесса, а не просто перечислять технику.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-base font-bold text-white block">Гусеничные экскаваторы</span>
                    <span className="text-[11px] text-slate-400">Подготовка участка и земляные работы</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-base font-bold text-white block">Буровые установки</span>
                    <span className="text-[11px] text-slate-400">Работы по проекту фундамента</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-base font-bold text-white block">Автобетононасосы</span>
                    <span className="text-[11px] text-slate-400">Подача смеси на сложных участках</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <span className="text-base font-bold text-white block">Самосвалы & Краны</span>
                    <span className="text-[11px] text-slate-400">Логистика, разгрузка и вывоз</span>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1000&q=80"
                  alt="Тяжелая спецтехника Ройстрой"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-xs text-slate-300">
                  Организация стройплощадки, техника и поставки должны быть просчитаны до старта работ.
                </div>
              </div>
            </div>
          )}

          {activeTab === "relief" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E9BA8] mb-2 block">
                  Сложная геология и склоны
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                  Работаем с рельефом: уклон, дренаж, подпорные стены и посадка дома
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                  Даже обычный участок может потребовать точной посадки дома, водоотведения, подпорных решений и корректного нулевого цикла. Ошибки на этом этапе потом дорого исправлять, поэтому рельеф нужно считать заранее.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-1" />
                    <p className="text-xs text-slate-200">
                      <strong>Мощные подпорные стены:</strong> Расчет устойчивости на оползневые сдвиги, пристенный дренаж и водоотведение ливневых потоков.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-1" />
                    <p className="text-xs text-slate-200">
                      <strong>Геология и шурфование перед проектированием:</strong> Обязательное бурение скважин для определения несущей способности скального пласта.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80"
                  alt="Строительство на склоне ЮБК"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-xs text-slate-300">
                  Визуальный пример участка со сложной геометрией. Реальные фотографии стоит заменить архивом компании.
                </div>
              </div>
            </div>
          )}

          {activeTab === "gost" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center animate-fade-in">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E9BA8] mb-2 block">
                  Юридическая и финансовая чистота
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white mb-4">
                  Фиксированная смета и поэтапная оплата по актам выполненных работ
                </h3>
                <p className="text-sm text-slate-300 leading-relaxed font-light mb-6">
                  Сильная строительная компания продает не только стены, а предсказуемость. Детальная спецификация материалов, этапы, график финансирования и порядок приемки должны быть понятны до выхода на участок.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-1" />
                    <p className="text-xs text-slate-200">
                      <strong>Поэтапная оплата:</strong> Оплата траншами только после подписания актов КС-2 и КС-3 за каждый завершенный этап (фундамент, коробка, кровля).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-[#8E9BA8] shrink-0 mt-1" />
                    <p className="text-xs text-slate-200">
                      <strong>Акты скрытых работ:</strong> Фото- и видеофиксация гидроизоляции, армирования и инженерных коммуникаций до заливки бетоном.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] border border-white/10">
                <img
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80"
                  alt="Официальный договор и сметная документация"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 p-3 bg-black/60 backdrop-blur-md rounded-xl border border-white/10 text-xs text-slate-300">
                  Договор, смета и акты закрывают главный страх заказчика: непредсказуемый бюджет.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
