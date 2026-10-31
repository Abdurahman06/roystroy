"use client";

import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./ConstructionStory.module.css";

interface ConstructionStoryProps {
  onSequenceCompleteChange: (isComplete: boolean) => void;
  onOpenConsultation: () => void;
}

const FILM_SOURCES = [
  "/animation-web/clean-v1/stage-1.mp4",
  "/animation-web/clean-v1/stage-2.mp4",
  "/animation-web/clean-v1/stage-3.mp4",
  "/animation-web/clean-v1/stage-4.mp4",
  "/animation-web/clean-v1/stage-5.mp4",
] as const;

const INTRO_VIEWPORTS = 1;
const EXIT_VIEWPORTS = 0.72;
const SECONDS_PER_VIEWPORT = 3;
const DEFAULT_CLIP_DURATION = 5.05;
const SEEK_THRESHOLD = 1 / 30;

const CHAPTERS = [
  {
    label: "Проект",
    title: ["От проекта", "к строительству."],
    description: "Ройстрой. Проектирование и строительство частных домов и коммерческих объектов в Крыму.",
  },
  {
    label: "Основание",
    title: ["Фундамент", "под ваш участок."],
    description: "Подготовка участка, земляные и бетонные работы. Основание с учётом грунта, рельефа и проекта.",
  },
  {
    label: "Монолит",
    title: ["Монолитные", "работы."],
    description: "Армирование, опалубка и бетонирование. Возводим стены и перекрытия будущего дома.",
  },
  {
    label: "Коробка",
    title: ["Дом обретает", "свою форму."],
    description: "Колонны, стены и перекрытия складываются в единую конструкцию. Строительство коробки здания по проекту.",
  },
  {
    label: "Фасад",
    title: ["От основания", "до готового дома."],
    description: "Кровля, фасад и остекление завершают облик здания. Обсудим ваш участок и задачи строительства.",
  },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value: number) {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

function setStyle(element: HTMLElement, property: "opacity" | "transform" | "visibility" | "filter" | "zIndex", value: string) {
  if (element.style[property] !== value) element.style[property] = value;
}

export default function ConstructionStory({ onSequenceCompleteChange, onOpenConsultation }: ConstructionStoryProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const logoRef = useRef<HTMLDivElement>(null);
  const exitRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Array<HTMLElement | null>>([]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<Array<HTMLLIElement | null>>([]);
  const progressRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const completeRef = useRef(false);
  const targetDistanceRef = useRef(0);
  const displayedDistanceRef = useRef(0);
  const animationFrameRef = useRef(0);
  const skipOverlayRef = useRef<HTMLDivElement>(null);
  const skipAnimationRef = useRef<Animation | null>(null);
  const skippingRef = useRef(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [durations, setDurations] = useState<number[]>([]);

  const skipIntro = useCallback(async () => {
    const section = sectionRef.current;
    const overlay = skipOverlayRef.current;
    if (!section || !overlay || skippingRef.current || completeRef.current) return;

    skippingRef.current = true;
    setIsSkipping(true);
    cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = 0;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    overlay.style.visibility = "visible";
    overlay.style.pointerEvents = "auto";

    try {
      const cover = overlay.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: reducedMotion ? 0 : 240,
        easing: "ease-in-out",
        fill: "forwards",
      });
      skipAnimationRef.current = cover;
      await cover.finished;
      if (!section.isConnected) return;
      overlay.style.opacity = "1";
      cover.cancel();

      // Move only under the opaque cover, bypassing CSS smooth scrolling
      // and the film's easing loop instead of fast-forwarding every stage.
      const end = window.scrollY + section.getBoundingClientRect().bottom;
      const distance = Math.max(0, section.offsetHeight - window.innerHeight);
      targetDistanceRef.current = distance;
      displayedDistanceRef.current = distance;
      completeRef.current = true;
      onSequenceCompleteChange(true);
      window.scrollTo({ top: end, behavior: "instant" });
      const heading = section.nextElementSibling?.querySelector<HTMLElement>("h2");
      if (heading) {
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
      }

      // Allow React to commit the header before uncovering the site.
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
      if (!section.isConnected) return;
      const reveal = overlay.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: reducedMotion ? 0 : 420,
        easing: "ease-out",
        fill: "forwards",
      });
      skipAnimationRef.current = reveal;
      await reveal.finished;
    } catch {
      // Unmounting cancels the in-progress transition.
    } finally {
      skipAnimationRef.current?.cancel();
      skipAnimationRef.current = null;
      overlay.style.opacity = "0";
      overlay.style.visibility = "hidden";
      overlay.style.pointerEvents = "none";
      skippingRef.current = false;
      if (section.isConnected) {
        setIsSkipping(false);
        window.dispatchEvent(new Event("scroll"));
      }
    }
  }, [onSequenceCompleteChange]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (skippingRef.current && ["Enter", " ", "ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End"].includes(event.key)) {
        event.preventDefault();
        return;
      }
      if (event.key !== "Enter" || event.repeat || event.defaultPrevented || event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return;
      const target = event.target;
      if (target instanceof Element && target.closest("a, button, input, textarea, select, [contenteditable], [role='button']")) return;
      const bounds = sectionRef.current?.getBoundingClientRect();
      if (!bounds || bounds.top > 0 || bounds.bottom <= window.innerHeight || completeRef.current) return;
      event.preventDefault();
      void skipIntro();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      skipAnimationRef.current?.cancel();
    };
  }, [skipIntro]);

  useEffect(() => {
    if (!isSkipping) return;
    const preventTransitionScroll = (event: Event) => event.preventDefault();
    window.addEventListener("wheel", preventTransitionScroll, { passive: false });
    window.addEventListener("touchmove", preventTransitionScroll, { passive: false });
    return () => {
      window.removeEventListener("wheel", preventTransitionScroll);
      window.removeEventListener("touchmove", preventTransitionScroll);
    };
  }, [isSkipping]);

  useEffect(() => {
    const section = sectionRef.current;
    const logo = logoRef.current;
    const exit = exitRef.current;
    if (!section || !logo || !exit) return;

    let introDistance = window.innerHeight * INTRO_VIEWPORTS;
    let filmDistance = 0;
    let exitDistance = window.innerHeight * EXIT_VIEWPORTS;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const titles = chapterRefs.current.map(chapter => chapter?.querySelector("h2"));
    const descriptions = chapterRefs.current.map(chapter => chapter?.querySelector("p"));
    let presentedIndex = -1;

    const getClipDurations = () => FILM_SOURCES.map((_, index) => durations[index] || DEFAULT_CLIP_DURATION);

    const updateGeometry = () => {
      const viewportHeight = window.innerHeight;
      introDistance = viewportHeight * INTRO_VIEWPORTS;
      exitDistance = viewportHeight * EXIT_VIEWPORTS;
      const totalDuration = getClipDurations().reduce((sum, duration) => sum + duration, 0);
      filmDistance = viewportHeight * (totalDuration / SECONDS_PER_VIEWPORT);
      section.style.height = `${viewportHeight + introDistance + filmDistance + exitDistance}px`;
    };

    const readScrollDistance = () => {
      const totalDistance = introDistance + filmDistance + exitDistance;
      return clamp(-section.getBoundingClientRect().top, 0, totalDistance);
    };

    const setVideoTime = (video: HTMLVideoElement | null, index: number, time: number) => {
      // Finish decoding before seeking again; seeked schedules the latest target.
      if (!video || video.readyState < 1 || video.seeking) return;
      const duration = video.duration || getClipDurations()[index];
      const nextTime = clamp(time, 0, Math.max(0, duration - 0.035));
      if (Math.abs((video.currentTime || 0) - nextTime) < SEEK_THRESHOLD) return;
      video.currentTime = nextTime;
    };

    const renderAtDistance = (distance: number) => {
      const filmStart = introDistance;
      const filmEnd = filmStart + filmDistance;
      const introProgress = smoothstep(distance / introDistance);
      const filmProgress = smoothstep((distance - filmStart) / filmDistance);
      const exitProgress = smoothstep((distance - filmEnd) / exitDistance);
      const clipDurations = getClipDurations();
      const totalDuration = clipDurations.reduce((sum, duration) => sum + duration, 0);

      setStyle(logo, "opacity", String(1 - introProgress));
      setStyle(logo, "transform", `translateY(${-introProgress * 18}px) scale(${1 - introProgress * 0.035})`);
      setStyle(exit, "opacity", String(exitProgress));

      const filmTime = clamp(filmProgress, 0, 1) * totalDuration;
      let elapsed = 0;
      let activeIndex = FILM_SOURCES.length - 1;
      let localTime = clipDurations[activeIndex];

      for (let index = 0; index < clipDurations.length; index += 1) {
        if (filmTime <= elapsed + clipDurations[index] || index === clipDurations.length - 1) {
          activeIndex = index;
          localTime = filmTime - elapsed;
          break;
        }
        elapsed += clipDurations[index];
      }

      const blurAmount = (1 - introProgress) * 24;
      const brightness = 0.68 + introProgress * 0.32;

      // Captions follow the same media clock as the videos, including reverse
      // scrolling. Only opacity and transforms change during a scroll frame.
      let chapterStart = 0;
      chapterRefs.current.forEach((chapter, index) => {
        const localProgress = clamp((filmTime - chapterStart) / clipDurations[index], 0, 1);
        const entering = index === 0
          ? smoothstep((distance / introDistance - .6) / .4)
          : smoothstep(localProgress / .13);
        const leaving = index === CHAPTERS.length - 1 ? 0 : smoothstep((localProgress - .86) / .14);
        const opacity = activeIndex === index ? entering * (1 - leaving) * (1 - exitProgress) : 0;
        if (chapter) {
          setStyle(chapter, "opacity", String(opacity));
          setStyle(chapter, "visibility", opacity > .001 ? "visible" : "hidden");
          const current = activeIndex === index && opacity > .15;
          if (chapter.dataset.current !== String(current)) {
            chapter.inert = !current;
            chapter.setAttribute("aria-hidden", String(!current));
            chapter.dataset.current = String(current);
          }
        }
        const offset = reducedMotion.matches ? 0 : (1 - entering) * 24 - leaving * 12;
        const title = titles[index];
        const description = descriptions[index];
        if (title) setStyle(title, "transform", `translateY(${offset}px)`);
        if (description) setStyle(description, "transform", `translateY(${offset * 1.35}px)`);
        const fill = progressRefs.current[index];
        if (fill) setStyle(fill, "transform", `scaleX(${localProgress})`);
        const step = stepRefs.current[index];
        if (step) {
          if (activeIndex === index && !step.hasAttribute("aria-current")) step.setAttribute("aria-current", "step");
          else if (activeIndex !== index && step.hasAttribute("aria-current")) step.removeAttribute("aria-current");
        }
        chapterStart += clipDurations[index];
      });
      if (timelineRef.current) {
        setStyle(timelineRef.current, "opacity", String(smoothstep((distance / introDistance - .6) / .4) * (1 - exitProgress)));
        const hidden = String(distance < introDistance * .6 || exitProgress > .9);
        if (timelineRef.current.getAttribute("aria-hidden") !== hidden) timelineRef.current.setAttribute("aria-hidden", hidden);
      }

      // Keep the active layer visible between frames instead of hiding/showing it
      // on every seek. Only adjacent clips need eager buffering.
      if (presentedIndex !== activeIndex) {
        videoRefs.current.forEach((video, index) => {
          if (!video) return;
          const active = index === activeIndex;
          setStyle(video, "opacity", active ? "1" : "0");
          setStyle(video, "zIndex", active ? "2" : "1");
          setStyle(video, "visibility", active ? "visible" : "hidden");
          const desiredPreload = Math.abs(index - activeIndex) <= 1 ? "auto" : "metadata";
          if (video.preload !== desiredPreload) video.preload = desiredPreload;
        });
        presentedIndex = activeIndex;
      }

      const activeVideo = videoRefs.current[activeIndex];
      if (activeVideo) {
        setStyle(activeVideo, "filter", blurAmount > 0 ? `blur(${blurAmount}px) brightness(${brightness})` : "none");
        setStyle(activeVideo, "transform", blurAmount > 0 ? "scale(1.06)" : "scale(1)");
        setVideoTime(activeVideo, activeIndex, localTime);
      }

      const isComplete = distance >= filmEnd + exitDistance - 1;
      if (completeRef.current !== isComplete) {
        completeRef.current = isComplete;
        onSequenceCompleteChange(isComplete);
      }
    };

    const animateToTarget = () => {
      const targetDistance = targetDistanceRef.current;
      const difference = targetDistance - displayedDistanceRef.current;
      displayedDistanceRef.current += difference * (reducedMotion.matches ? 1 : 0.16);
      if (Math.abs(difference) < 0.65) displayedDistanceRef.current = targetDistance;
      renderAtDistance(displayedDistanceRef.current);

      if (displayedDistanceRef.current !== targetDistance) {
        animationFrameRef.current = requestAnimationFrame(animateToTarget);
      } else {
        animationFrameRef.current = 0;
      }
    };

    const scheduleRender = (force = false) => {
      if (skippingRef.current || document.hidden) return;
      const distance = readScrollDistance();
      if (!force && targetDistanceRef.current === distance && displayedDistanceRef.current === distance) return;
      targetDistanceRef.current = distance;
      if (!animationFrameRef.current) animationFrameRef.current = requestAnimationFrame(animateToTarget);
    };
    const syncToScroll = () => scheduleRender();
    const syncToMedia = () => {
      if (section.getBoundingClientRect().bottom <= 0) return;
      scheduleRender(true);
    };
    const syncVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = 0;
      } else {
        scheduleRender(true);
      }
    };

    const handleResize = () => {
      updateGeometry();
      scheduleRender(true);
    };
    // Media may become ready after the scroll easing loop has already stopped.
    const videos = videoRefs.current.filter((video): video is HTMLVideoElement => video !== null);
    videos.forEach((video) => {
      video.addEventListener("loadeddata", syncToMedia);
      video.addEventListener("seeked", syncToMedia);
    });

    updateGeometry();
    scheduleRender(true);
    window.addEventListener("scroll", syncToScroll, { passive: true });
    window.addEventListener("resize", handleResize);
    reducedMotion.addEventListener("change", syncToMedia);
    document.addEventListener("visibilitychange", syncVisibility);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      // A cancelled frame must not prevent the next effect from scheduling work.
      animationFrameRef.current = 0;
      videos.forEach((video) => {
        video.removeEventListener("loadeddata", syncToMedia);
        video.removeEventListener("seeked", syncToMedia);
      });
      window.removeEventListener("scroll", syncToScroll);
      window.removeEventListener("resize", handleResize);
      reducedMotion.removeEventListener("change", syncToMedia);
      document.removeEventListener("visibilitychange", syncVisibility);
    };
  }, [durations, onSequenceCompleteChange]);

  const handleMetadata = (index: number, element: HTMLVideoElement) => {
    const duration = Number.isFinite(element.duration) && element.duration > 0
      ? element.duration
      : DEFAULT_CLIP_DURATION;
    setDurations((current) => {
      if (Math.abs((current[index] || 0) - duration) < 0.01) return current;
      const next = [...current];
      next[index] = duration;
      return next;
    });
  };

  return (
    <section ref={sectionRef} id="construction-film" aria-label="Ройстрой: от проекта до готового дома" data-film-rate={SECONDS_PER_VIEWPORT} data-intro-viewports={INTRO_VIEWPORTS} className="relative bg-black">
      <div className="sticky top-0 h-[100svh] min-h-[360px] overflow-hidden bg-black">
        <div className="absolute inset-0 bg-[#050607]" aria-hidden="true" />

        {FILM_SOURCES.map((source, index) => (
          <video
            key={source}
            ref={(element) => {
              videoRefs.current[index] = element;
            }}
            className="absolute inset-0 h-full w-full object-cover"
            src={source}
            poster={source.replace(/\.mp4$/, ".jpg")}
            muted
            playsInline
            preload={index === 0 ? "auto" : "metadata"}
            aria-hidden={index !== 0}
            tabIndex={-1}
            onLoadedMetadata={(event) => handleMetadata(index, event.currentTarget)}
            style={{
              opacity: index === 0 ? 1 : 0,
              visibility: index === 0 ? "visible" : "hidden",
              filter: "blur(24px) brightness(0.68)",
              transform: "scale(1.06)",
            }}
          />
        ))}

        <div className={styles.shade} aria-hidden="true" />

        <div
          ref={logoRef}
          className={styles.logo}
          style={{ opacity: 1 }}
        >
          <Image
            src="/logo-white.png"
            alt="Ройстрой"
            width={1200}
            height={360}
            priority
            className="h-auto w-[min(84vw,920px)] object-contain drop-shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
          />
          <p>Проектирование и строительство в Крыму</p>
        </div>

        <div className={styles.copy}>
          {CHAPTERS.map((chapter, index) => (
            <article
              key={chapter.label}
              ref={element => { chapterRefs.current[index] = element; }}
              className={styles.chapter}
              data-chapter={index}
              data-current="false"
              aria-hidden="true"
              inert
            >
              <h2>{chapter.title.map(line => <span key={line}>{line}</span>)}</h2>
              <p>{chapter.description}</p>
              {index === CHAPTERS.length - 1 && (
                <button
                  type="button"
                  className={styles.action}
                  disabled={isSkipping}
                  onClick={async () => {
                    await skipIntro();
                    if (sectionRef.current?.isConnected && completeRef.current) onOpenConsultation();
                  }}
                >
                  Обсудить проект <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </article>
          ))}
        </div>

        <div ref={timelineRef} className={styles.timeline} aria-hidden="true">
          <ol className={styles.steps} aria-label="Этапы строительства">
            {CHAPTERS.map((chapter, index) => (
              <li key={chapter.label} ref={element => { stepRefs.current[index] = element; }} className={styles.step}>
                <span className={styles.track} aria-hidden="true"><span ref={element => { progressRefs.current[index] = element; }} className={styles.fill} /></span>
                <span>{chapter.label}</span>
              </li>
            ))}
          </ol>
          <span className={styles.disclaimer}>Визуализация этапов строительства</span>
        </div>

        <div ref={exitRef} className="pointer-events-none absolute inset-0 z-20 bg-[#e8e6e1]" style={{ opacity: 0 }} />

        <button
          type="button"
          onClick={() => void skipIntro()}
          disabled={isSkipping}
          title="Пропустить анимацию (Enter)"
          className={styles.skip}
        >
          Пропустить
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div
        ref={skipOverlayRef}
        aria-hidden="true"
        className="fixed inset-0 z-[100] bg-[#e8e6e1]"
        style={{ opacity: 0, visibility: "hidden", pointerEvents: "none" }}
      />
    </section>
  );
}
