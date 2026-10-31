"use client";

import React from "react";
import { Video, ShieldCheck, FileCheck, Smartphone, CheckCircle, Radio } from "lucide-react";

export default function TransparentWorkflow() {
  const steps = [
    {
      icon: Video,
      title: "Онлайн-камеры 24/7",
      desc: "На каждом объекте устанавливаем HD-камеры с круглосуточным доступом через приложение в вашем смартфоне."
    },
    {
      icon: Radio,
      title: "Аэросъемка с квадрокоптера",
      desc: "Еженедельные видеоотчеты с воздуха: вы видите реальный прогресс монолита и земляных работ в высоком разрешении."
    },
    {
      icon: ShieldCheck,
      title: "Лабораторный контроль бетона",
      desc: "Каждая партия заводского бетона В25/В30 проходит отбор кубиков и ультразвуковую проверку набора марочной прочности."
    },
    {
      icon: FileCheck,
      title: "Акты скрытых работ",
      desc: "Подписание актов и фотофиксация арматурных каркасов и гидроизоляции до момента заливки бетонной смеси."
    }
  ];

  return (
    <section className="concrete-section py-24 relative border-t border-black/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight mb-4">
            Полный контроль над стройкой <br />
            из любой точки мира
          </h2>
          <p className="text-slate-400 text-sm sm:text-base font-light">
            Многие наши заказчики живут в Москве, Санкт-Петербурге и других городах. Мы обеспечиваем абсолютную прозрачность без необходимости постоянного присутствия на площадке.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10 hover:border-[#8E9BA8]/40 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-[#8E9BA8]/10 border border-[#8E9BA8]/20 flex items-center justify-center text-[#8E9BA8] mb-5 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif text-xl font-bold text-white mb-2 group-hover:text-[#8E9BA8] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-light">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
                  <span>Этап 0{idx + 1}</span>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
