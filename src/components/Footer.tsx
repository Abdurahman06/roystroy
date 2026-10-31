"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Instagram, Send, Pause, Play } from "lucide-react";
import { COMPANY } from "@/lib/company";
import styles from "./Footer.module.css";

export default function Footer() {
  const footerRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearby, setNearby] = useState(false);
  const [visible, setVisible] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);
  const [autoplay, setAutoplay] = useState(false);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const wantsPlayback = userPlaying ?? autoplay;
  const loadVideo = nearby && (autoplay || userPlaying !== null);

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const updateMotion = () => {
      setAutoplay(!motion.matches && !connection?.saveData);
      setUserPlaying(null);
    };
    const updateVisibility = () => setPageVisible(!document.hidden);
    updateMotion();
    updateVisibility();
    motion.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);

    const preloadObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearby(true);
        preloadObserver.disconnect();
      }
    }, { rootMargin: "600px" });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting);
    });
    preloadObserver.observe(footer);
    visibilityObserver.observe(footer);

    return () => {
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
      motion.removeEventListener("change", updateMotion);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (loadVideo && visible && pageVisible && wantsPlayback && !failed) {
      video.play().catch(() => setPlaying(false));
    } else {
      video.pause();
    }
  }, [loadVideo, visible, pageVisible, wantsPlayback, failed]);

  return (
    <footer ref={footerRef} className={styles.footer}>
      <div className={styles.media} aria-hidden="true">
        {nearby && <img src="/footer/villa-poster.webp" alt="" width="1280" height="722" className={styles.poster} />}
        <video
          ref={videoRef}
          className={`${styles.video} ${ready && !failed ? styles.videoReady : ""}`}
          src={loadVideo ? "/footer/villa-loop.mp4" : undefined}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
          disablePictureInPicture
          onLoadedData={() => setReady(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => { setFailed(true); setPlaying(false); }}
        />
      </div>
      <div className={styles.shade} aria-hidden="true" />

      <div className={styles.content}>
        <div className={styles.columns}>
          <div className={styles.brand}>
            <a href="#" className={styles.logoLink} aria-label="Ройстрой, на главную">
              <Image
                src="/logo-white.png"
                alt="Ройстрой"
                width={190}
                height={59}
                sizes="(max-width: 1023px) 150px, 190px"
                className={styles.logo}
              />
            </a>
            <div className={styles.brandDetails}>
              <p>
                Архитектурно-строительное бюро полного цикла. Проектирование и капитальное строительство индивидуальных монолитных вилл и резиденций в Крыму. Фиксация сметы и сроков по СП и ГОСТ.
              </p>
              <div className={styles.socials}>
                <a href={COMPANY.instagramHref} target="_blank" rel="noopener noreferrer" className={styles.iconButton} title="Instagram @roystroy.crimea" aria-label="Instagram @roystroy.crimea">
                  <Instagram size={18} />
                </a>
                <a href={COMPANY.whatsappHref} target="_blank" rel="noopener noreferrer" className={styles.iconButton} title="Написать в WhatsApp" aria-label="Написать в WhatsApp">
                  <Send size={18} />
                </a>
                {!failed && (
                  <button
                    type="button"
                    className={styles.iconButton}
                    title={playing ? "Приостановить фоновое видео" : "Включить фоновое видео"}
                    aria-label={playing ? "Приостановить фоновое видео" : "Включить фоновое видео"}
                    onClick={() => setUserPlaying(!playing)}
                  >
                    {playing ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                )}
              </div>
            </div>
          </div>

          <nav className={styles.column} aria-label="Навигация в подвале">
            <h3>Навигация</h3>
            <ul>
              <li><a href="#projects">Проекты вилл</a></li>
              <li><a href="#3d-explorer">3D-Эксплорер <span className={styles.degree}>360°</span></a></li>
              <li><a href="#engineering">Сейсмика 9 баллов</a></li>
              <li><a href="#calculator">Калькулятор сметы</a></li>
              <li><a href="#crimea-map">Карта объектов</a></li>
            </ul>
          </nav>

          <div className={styles.column}>
            <h3>География</h3>
            <ul>
              <li>Ялта &amp; Ливадия</li>
              <li>Севастополь &amp; Фиолент</li>
              <li>Форос &amp; Симеиз</li>
              <li>Алушта &amp; Гурзуф</li>
              <li>Симферополь &amp; пригород</li>
              <li>Судак &amp; Новый Свет</li>
            </ul>
          </div>

          <div className={`${styles.column} ${styles.contacts}`}>
            <h3>Контакты в Крыму</h3>
            <a href={COMPANY.phonePrimaryHref} className={styles.phone}>{COMPANY.phonePrimary}</a>
            <p>{COMPANY.address}</p>
            <p className={styles.hours}>{COMPANY.workHours}</p>
          </div>
        </div>

        <div className={styles.legal}>
          <p>© {new Date().getFullYear()} ООО «Ройстрой». Все права защищены. Строительство домов и вилл в Крыму под ключ.</p>
          <div className={styles.legalLinks}>
            <span>СП 14.13330.2018 Сейсмика</span>
            <span>ГОСТ 27751-2014</span>
            <span>Политика конфиденциальности</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
