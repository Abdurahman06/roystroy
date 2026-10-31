"use client";

import React, { useState, useId } from "react";
import { 
  Sparkles, 
  Send, 
  Check, 
  HelpCircle, 
  ArrowRight,
  TrendingDown,
  Building2,
  FileSpreadsheet
} from "lucide-react";
import { buildWhatsAppLeadUrl } from "@/lib/company";

interface HouseCalculatorProps {
  onOpenConsultationWithEstimate?: (details: string) => void;
  preselectedProject?: string;
}

export default function HouseCalculator({ 
  onOpenConsultationWithEstimate,
  preselectedProject 
}: HouseCalculatorProps) {
  const [area, setArea] = useState(320);
  const [terrain, setTerrain] = useState<"flat" | "medium" | "steep">("medium");
  const [packageType, setPackageType] = useState<"contour" | "whitebox" | "turnkey">("whitebox");
  const [addPool, setAddPool] = useState(true);
  const [addRoofDeck, setAddRoofDeck] = useState(true);
  const [addPanoramicGlazing, setAddPanoramicGlazing] = useState(false);

  // Contact modal state inside calculator
  const [clientPhone, setClientPhone] = useState("");
  const [clientMessenger, setClientMessenger] = useState<"whatsapp" | "telegram">("whatsapp");
  const [isSent, setIsSent] = useState(false);

  // Price Calculation Logic
  // Base rates per m2
  const packageRates = {
    contour: 68000,
    whitebox: 98000,
    turnkey: 142000,
  };

  // Terrain multiplier for Crimean relief
  const terrainMultipliers = {
    flat: 1.0,      // Plain / Steppe Crimea
    medium: 1.15,   // Foothill slope up to 15 degrees
    steep: 1.28,    // Steep rock cliff of South Coast 15-35 degrees
  };

  // Base house cost
  const baseCost = area * packageRates[packageType] * terrainMultipliers[terrain];

  // Options cost
  let optionsCost = 0;
  if (addPool) optionsCost += 3400000;
  if (addRoofDeck) optionsCost += 1600000;
  if (addPanoramicGlazing) optionsCost += 2200000;

  const totalEstimate = Math.round(baseCost + optionsCost);

  // Estimated build duration
  let durationMonths = 8;
  if (area > 300) durationMonths += 2;
  if (area > 450) durationMonths += 2;
  if (terrain === "steep") durationMonths += 1;

  // Mortgage Estimation (e.g. Family / IT mortgage 6%)
  const downPayment = Math.round(totalEstimate * 0.2); // 20%
  const loanAmount = totalEstimate - downPayment;
  // Annuity formula for 25 years at 6%
  const monthlyRate = 0.06 / 12;
  const numMonths = 25 * 12;
  const monthlyPayment = Math.round(
    (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, numMonths)) /
    (Math.pow(1 + monthlyRate, numMonths) - 1)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientPhone) return;

    setIsSent(true);

    const packageLabels = {
      contour: "Теплый контур",
      whitebox: "White Box + фасад",
      turnkey: "Дом под ключ",
    };

    const terrainLabels = {
      flat: "Ровный участок",
      medium: "Уклон до 15 градусов",
      steep: "Склон 15-35 градусов",
    };

    const leadText = [
      "Здравствуйте! Хочу получить предварительную смету Ройстрой.",
      `Площадь: ${area} м²`,
      `Комплектация: ${packageLabels[packageType]}`,
      `Рельеф: ${terrainLabels[terrain]}`,
      `Опции: ${[
        addPool ? "бассейн" : "",
        addRoofDeck ? "эксплуатируемая кровля" : "",
        addPanoramicGlazing ? "панорамное остекление" : "",
      ].filter(Boolean).join(", ") || "без доп. опций"}`,
      `Ориентир: ${(totalEstimate / 1000000).toFixed(1)} млн ₽`,
      `Телефон клиента: ${clientPhone}`,
    ].join("\n");

    window.open(buildWhatsAppLeadUrl(leadText), "_blank", "noopener,noreferrer");

    onOpenConsultationWithEstimate?.(leadText);
  };

  return (
    <section id="calculator" className="concrete-section py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Рассчитайте стоимость дома <br />
            с учетом геологии вашего участка
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Предварительный расчет помогает быстро понять порядок бюджета. Точную смету нужно считать после проекта, участка и выбранной комплектации.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls Column (7 cols) */}
          <div className="lg:col-span-7 glass-panel rounded-3xl p-6 sm:p-8 border border-white/10 space-y-8">
            {/* 1. Area Slider */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-sm font-semibold text-slate-200">
                  Общая площадь дома:
                </label>
                <div className="px-3.5 py-1 rounded-xl bg-white/10 text-[#8E9BA8] font-bold text-lg font-serif">
                  {area} м²
                </div>
              </div>
              <input
                type="range"
                min={150}
                max={650}
                step={10}
                value={area}
                onChange={(e) => setArea(Number(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#8E9BA8]"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                <span>150 м² (Компакт)</span>
                <span>350 м² (Семейная)</span>
                <span>650 м² (Гранд-резиденция)</span>
              </div>
            </div>

            {/* 2. Crimean Terrain Selector */}
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-3">
                Характер рельефа участка в Крыму:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTerrain("flat")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    terrain === "flat"
                      ? "bg-[#8E9BA8]/15 border-[#8E9BA8] text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-xs block text-white">Ровный участок</span>
                  <span className="text-[10px] text-slate-400">Симферополь, Евпатория, Саки</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTerrain("medium")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    terrain === "medium"
                      ? "bg-[#8E9BA8]/15 border-[#8E9BA8] text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-xs block text-white">Уклон до 15°</span>
                  <span className="text-[10px] text-slate-400">Севастополь, Фиолент, предгорье</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTerrain("steep")}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    terrain === "steep"
                      ? "bg-[#8E9BA8]/15 border-[#8E9BA8] text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <span className="font-bold text-xs block text-white">Склон 15–35° ЮБК</span>
                  <span className="text-[10px] text-slate-400">Ялта, Форос, скала, подпорные стены</span>
                </button>
              </div>
            </div>

            {/* 3. Package Selector */}
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-3">
                Комплектация строительства:
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setPackageType("contour")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    packageType === "contour"
                      ? "bg-[#8E9BA8]/15 border-[#8E9BA8] text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className="font-bold text-xs text-white">Теплый контур</div>
                  <div className="text-[10px] text-[#8E9BA8] my-1">от 68 000 ₽/м²</div>
                  <p className="text-[10px] text-slate-400">
                    Фундамент, коробка, кровля, окна и базовая защита контура.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPackageType("whitebox")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    packageType === "whitebox"
                      ? "bg-[#8E9BA8]/15 border-[#8E9BA8] text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className="font-bold text-xs text-white">White Box + Фасад</div>
                  <div className="text-[10px] text-[#8E9BA8] my-1">от 98 000 ₽/м²</div>
                  <p className="text-[10px] text-slate-400">
                    + инженерная разводка, фасадные работы, подготовка поверхностей.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPackageType("turnkey")}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    packageType === "turnkey"
                      ? "bg-[#8E9BA8]/15 border-[#8E9BA8] text-white"
                      : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                  }`}
                >
                  <div className="font-bold text-xs text-white">Дом под ключ</div>
                  <div className="text-[10px] text-[#8E9BA8] my-1">от 142 000 ₽/м²</div>
                  <p className="text-[10px] text-slate-400">
                    + отделка, сантехника, свет, террасы и финальная комплектация.
                  </p>
                </button>
              </div>
            </div>

            {/* 4. Additional Options */}
            <div>
              <label className="text-sm font-semibold text-slate-200 block mb-3">
                Дополнительные опции:
              </label>
              <div className="space-y-2.5">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={addPool}
                      onChange={(e) => setAddPool(e.target.checked)}
                      className="w-4 h-4 rounded text-[#8E9BA8] focus:ring-0 bg-black/40 border-white/20"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Бассейн с подогревом и переливом
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Чаша, инженерия и отделка рассчитываются по проекту
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#8E9BA8]">+3.4 млн ₽</span>
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={addRoofDeck}
                      onChange={(e) => setAddRoofDeck(e.target.checked)}
                      className="w-4 h-4 rounded text-[#8E9BA8] focus:ring-0 bg-black/40 border-white/20"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Эксплуатируемая кровля или терраса
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Гидроизоляция, уклоны, водоотведение и покрытие
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#8E9BA8]">+1.6 млн ₽</span>
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 cursor-pointer hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={addPanoramicGlazing}
                      onChange={(e) => setAddPanoramicGlazing(e.target.checked)}
                      className="w-4 h-4 rounded text-[#8E9BA8] focus:ring-0 bg-black/40 border-white/20"
                    />
                    <div>
                      <span className="text-xs font-semibold text-white block">
                        Панорамное алюминиевое остекление
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Светопрозрачные порталы под проект, климат и бюджет
                      </span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#8E9BA8]">+2.2 млн ₽</span>
                </label>
              </div>
            </div>
          </div>

          {/* Result Sticky Column (5 cols) */}
          <div className="lg:col-span-5 glass-panel-accent rounded-3xl p-6 sm:p-8 border border-[#8E9BA8]/30 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[#8E9BA8]">
                  Предварительный расчет
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold">
                  Фиксация в договоре
                </span>
              </div>

              {/* Total Price Display */}
              <div className="mb-6">
                <span className="text-xs text-slate-400 block mb-1">
                  Ориентировочный бюджет строительства:
                </span>
                <div className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  {totalEstimate.toLocaleString("ru-RU")} ₽
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  ~ {Math.round(totalEstimate / area).toLocaleString("ru-RU")} ₽ за 1 м² площади
                </div>
              </div>

              {/* Specs Breakdown */}
              <div className="space-y-3 p-4 rounded-2xl bg-black/30 border border-white/10 text-xs mb-6">
                <div className="flex justify-between text-slate-300">
                  <span>Срок строительства:</span>
                  <strong className="text-white">{durationMonths}–{durationMonths + 2} месяцев</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Конструктив:</span>
                  <strong className="text-[#8E9BA8]">по СП и проекту</strong>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Гарантия:</span>
                  <strong className="text-white">по договору</strong>
                </div>
              </div>

              {/* Mortgage Box */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
                  <Building2 className="w-4 h-4 text-[#8E9BA8]" />
                  <span>Ориентир финансовой нагрузки:</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Платеж от:</span>
                  <span className="font-serif text-xl font-bold text-[#8E9BA8]">
                    {monthlyPayment.toLocaleString("ru-RU")} ₽/мес
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">
                  Пример при первоначальном взносе 20% ({downPayment.toLocaleString("ru-RU")} ₽). Не является банковским предложением; реальные условия нужно уточнять на дату заявки.
                </span>
              </div>
            </div>

            {/* Form to Receive Full PDF Estimate */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <span className="text-xs font-semibold text-slate-200 block">
                Куда прислать развернутую смету с графиком оплат?
              </span>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setClientMessenger("whatsapp")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    clientMessenger === "whatsapp"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-white/5 text-slate-300 border border-white/10"
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setClientMessenger("telegram")}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                    clientMessenger === "telegram"
                      ? "bg-[#444444] text-white shadow-lg"
                      : "bg-white/5 text-slate-300 border border-white/10"
                  }`}
                >
                  Telegram
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="tel"
                  required
                  placeholder="+7 (978) 000-00-00"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl bg-black/50 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#8E9BA8]"
                />
                <button
                  type="submit"
                  disabled={isSent}
                  className="px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider text-black bg-[#8E9BA8] hover:bg-[#C8D0D8] transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isSent ? (
                    <>
                      <Check className="w-4 h-4 text-black" />
                      <span>Отправлено!</span>
                    </>
                  ) : (
                    <>
                      <span>Получить смету</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 text-center font-light">
                Бесплатно предоставим предварительную разбивку этапов и выезд инженера на участок по Крыму.
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
