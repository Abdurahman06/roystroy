"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Instagram, Pause, Play } from "lucide-react";
import { COMPANY } from "@/lib/company";
import reelData from "@/data/instagram-reels.json";
import styles from "./InstagramFeed.module.css";

interface Reel {
  id: string;
  title: string;
  video: string;
  poster: string;
  instagramUrl: string | null;
}

function ReelCard({ reel, autoplay, pageVisible }: {
  reel: Reel;
  autoplay: boolean;
  pageVisible: boolean;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [nearby, setNearby] = useState(false);
  const [visible, setVisible] = useState(false);
  const [userPlaying, setUserPlaying] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const wantsPlayback = userPlaying ?? autoplay;
  const loadVideo = nearby && (autoplay || userPlaying !== null);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const preloadObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setNearby(true);
        preloadObserver.disconnect();
      }
    }, { rootMargin: "240px" });
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      setVisible(entry.isIntersecting && entry.intersectionRatio >= 0.15);
    }, { threshold: [0, 0.15] });
    preloadObserver.observe(card);
    visibilityObserver.observe(card);
    return () => {
      preloadObserver.disconnect();
      visibilityObserver.disconnect();
    };
  }, []);

  useEffect(() => setUserPlaying(null), [autoplay]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    if (loadVideo && visible && pageVisible && wantsPlayback && !failed) {
      video.muted = true;
      video.play().catch(() => {
        if (!cancelled) setPlaying(false);
      });
    } else {
      video.pause();
    }
    return () => {
      cancelled = true;
      video.pause();
    };
  }, [loadVideo, visible, pageVisible, wantsPlayback, userPlaying, failed]);

  const caption = (
    <>
      <h3>{reel.title}</h3>
      <span className={styles.captionBottom}>
        <span>@roystroy.crimea</span>
        {reel.instagramUrl && <span className={styles.openReel}>Смотреть рилс <ArrowUpRight size={15} /></span>}
      </span>
    </>
  );

  return (
    <article ref={cardRef} className={styles.card} data-reel={reel.id}>
      <div className={styles.media} aria-hidden="true">
        {nearby && <img src={reel.poster} alt="" width={540} height={960} className={styles.poster} decoding="async" />}
        <video
          ref={videoRef}
          src={loadVideo ? reel.video : undefined}
          className={`${styles.video} ${ready && !failed ? styles.ready : ""}`}
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
      {reel.instagramUrl ? (
        <a href={reel.instagramUrl} target="_blank" rel="noopener noreferrer"
          className={styles.reelLink} aria-label={`${reel.title}: открыть рилс в Instagram (новая вкладка)`}>
          <span className={styles.reelMark}><Instagram size={18} aria-hidden="true" /></span>
          <div className={styles.caption}>{caption}</div>
        </a>
      ) : (
        <div className={styles.pendingLink}>
          <span className={styles.reelMark}><Instagram size={18} aria-hidden="true" /></span>
          <div className={styles.caption}>{caption}</div>
        </div>
      )}
      {!failed && (
        <button type="button" className={styles.playback}
          title={playing ? "Приостановить превью" : "Включить превью"}
          aria-label={`${playing ? "Приостановить" : "Включить"} превью: ${reel.title}`}
          onClick={() => setUserPlaying(!playing)}>
          {playing ? <Pause size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
        </button>
      )}
    </article>
  );
}

export default function InstagramFeed() {
  const [autoplay, setAutoplay] = useState(false);
  const [pageVisible, setPageVisible] = useState(true);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const connection = (navigator as Navigator & {
      connection?: EventTarget & { saveData?: boolean };
    }).connection;
    const updatePreferences = () => setAutoplay(!motion.matches && !connection?.saveData);
    const updateVisibility = () => setPageVisible(!document.hidden);
    updatePreferences();
    updateVisibility();
    motion.addEventListener("change", updatePreferences);
    connection?.addEventListener("change", updatePreferences);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      motion.removeEventListener("change", updatePreferences);
      connection?.removeEventListener("change", updatePreferences);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, []);

  return (
    <section id="instagram" className={`concrete-section ${styles.section}`} aria-labelledby="instagram-title">
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h2 id="instagram-title">Смотрите стройки<br />в Instagram <span>@roystroy.crimea</span></h2>
            <p>Монолитные работы, детали строительства и готовые объекты в видео нашей команды.</p>
          </div>
          <a href={COMPANY.instagramHref} target="_blank" rel="noopener noreferrer" className={styles.profileLink}>
            <Instagram size={18} aria-hidden="true" />
            <span>Наш Instagram</span>
            <ArrowUpRight size={18} aria-hidden="true" />
          </a>
        </div>
        <div className={styles.grid}>
          {reelData.map(reel => <ReelCard key={reel.id} reel={reel} autoplay={autoplay} pageVisible={pageVisible} />)}
        </div>
      </div>
    </section>
  );
}
