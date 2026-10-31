"use client";

import React, { useEffect, useState } from "react";
import { X, Send, CheckCircle2, Phone, MessageSquare, ShieldCheck, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import { buildWhatsAppLeadUrl, COMPANY } from "@/lib/company";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMessage?: string;
}

export default function ContactModal({ isOpen, onClose, initialMessage }: ContactModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("Есть участок, нужен проект и смета");
  const [message, setMessage] = useState(initialMessage || "");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setMessage(initialMessage || "");
    setSubmitted(false);
  }, [initialMessage, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;

    setSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    const leadText = [
      "Здравствуйте! Хочу обсудить строительство с Ройстрой.",
      `Имя: ${name}`,
      `Телефон: ${phone}`,
      `Статус: ${stage}`,
      message ? `Детали: ${message}` : "",
    ].filter(Boolean).join("\n");

    window.open(buildWhatsAppLeadUrl(leadText), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-start justify-center p-4 sm:p-6 overflow-y-auto animate-fade-in">
      <div className="relative my-auto w-full max-w-lg bg-[#0d0d0d] border border-white/15 rounded-3xl overflow-hidden shadow-2xl p-6 sm:p-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        {submitted ? (
          <div className="py-10 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-[#8E9BA8]/20 border border-[#8E9BA8] flex items-center justify-center text-[#8E9BA8] mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
              Заявка подготовлена
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 font-light max-w-sm mx-auto leading-relaxed">
              Мы открыли WhatsApp с готовым сообщением для менеджера. Если окно не появилось, напишите напрямую на {COMPANY.phonePrimary}.
            </p>
            <div className="pt-4">
              <a
                href={COMPANY.whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-[#8E9BA8] hover:bg-[#C8D0D8] transition-colors"
              >
                Открыть WhatsApp
              </a>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-6">
              <div className="inline-flex items-center gap-1.5 text-xs text-[#8E9BA8] font-semibold mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Прямой контакт с инженером бюро</span>
              </div>
              <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Обсудить проект виллы
              </h3>
              <p className="text-xs text-slate-400 mt-1 font-light">
                Бесплатно проконсультируем по геологии вашего участка в Крыму и составим предварительный расчет сметы.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Ваше имя:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Константин"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#8E9BA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Телефон для связи (WhatsApp / Telegram):
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+7 (978) 000-00-00"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#8E9BA8]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Статус вашего проекта:
                </label>
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#090d16] border border-white/10 text-xs text-white focus:outline-none focus:border-[#8E9BA8]"
                >
                  <option value="Есть участок, нужен проект и смета">Есть участок в Крыму, нужен проект и смета</option>
                  <option value="Выбираю участок, нужна оценка геологии">Только выбираю участок, нужна оценка уклона и грунта</option>
                  <option value="Есть готовый проект, нужен расчет строительства">Есть готовый проект, нужен расчет монолита под ключ</option>
                  <option value="Индивидуальное VIP-проектирование">Индивидуальное архитектурное проектирование виллы</option>
                </select>
              </div>

              {initialMessage && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Детали расчета:
                  </label>
                  <textarea
                    rows={2}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 focus:outline-none focus:border-[#8E9BA8]"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-4 rounded-xl font-bold uppercase tracking-wider text-xs text-[#0a0a0a] bg-gradient-to-r from-[#C8D0D8] via-[#8E9BA8] to-[#6B7A87] shadow-xl shadow-[#8E9BA8]/20 hover:shadow-[#8E9BA8]/40 transition-all flex items-center justify-center gap-2 mt-2"
              >
                <span>Отправить заявку инженеру</span>
                <Send className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-slate-500 pt-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Конфиденциально • Работаем по договору генерального подряда</span>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
