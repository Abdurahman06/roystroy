"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Building2, House, Layers3, Mountain, MoveLeft } from "lucide-react";
import { useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import styles from "./filters.module.css";

const CATEGORIES = [
  { id: "all", label: "Все", icon: Layers3 },
  { id: "compact", label: "Компактные дома", icon: House },
  { id: "private", label: "Частные и коммерческие", icon: Building2 },
  { id: "complex", label: "Сложные участки", icon: Mountain },
] as const;

const PROJECTS = [
  { id: "mirnoe", title: "Дом в с. Мирное", location: "Симферопольский район", category: "private", image: "photo-1600585154340-be6161a56a0c" },
  { id: "sun-valley", title: "Дом в Солнечной долине", location: "Судакский район", category: "complex", image: "photo-1600596542815-ffad4c1539a9" },
  { id: "mechta", title: "Дом в ТСН «Мечта»", location: "Крым", category: "compact", image: "photo-1613490493576-7fde63acd811" },
  { id: "commercial", title: "Коммерческий объект", location: "Бахчисарайский район", category: "private", image: "photo-1503387762-592deb58ef4e" },
] as const;

const VARIANTS = [
  { id: "blueprint", number: "01", name: "Чертёж" },
  { id: "console", number: "02", name: "Пульт" },
  { id: "facade", number: "03", name: "Фасад" },
  { id: "slider", number: "04", name: "Бегунок" },
  { id: "mechanical", number: "05", name: "Клавиши" },
  { id: "markup", number: "06", name: "Разметка" },
] as const;

function FilterVariant({ variant }: { variant: (typeof VARIANTS)[number] }) {
  const [active, setActive] = useState(0);
  const buttonsRef = useRef<Array<HTMLButtonElement | null>>([]);
  const category = CATEGORIES[active];
  const projects = PROJECTS.filter(project => category.id === "all" || project.category === category.id);
  const indicatorStyle = {
    "--active": active,
    "--column": active % 2,
    "--row": Math.floor(active / 2),
  } as CSSProperties;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let next: number;
    if (event.key === "ArrowRight") next = (index + 1) % CATEGORIES.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + CATEGORIES.length) % CATEGORIES.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = CATEGORIES.length - 1;
    else return;
    event.preventDefault();
    setActive(next);
    buttonsRef.current[next]?.focus();
  };

  return (
    <section id={variant.id} className={`${styles.variant} ${styles[variant.id]}`} aria-labelledby={`${variant.id}-title`}>
      <div className={styles.inner}>
        <div className={styles.sectionHeading}>
          <div className={styles.name}>
            <span className={styles.number}>{variant.number}</span>
            <h2 id={`${variant.id}-title`}>{variant.name}</h2>
          </div>
          <span className={styles.resultCount} aria-live="polite">
            <span>{String(projects.length).padStart(2, "0")}</span> / 04
          </span>
        </div>

        <div className={styles.switchFrame}>
          <div className={styles.ruler} aria-hidden="true" />
          <div role="tablist" aria-label={`Категории проектов: ${variant.name}`} className={styles.switcher} style={indicatorStyle}>
            <span className={styles.indicator} aria-hidden="true" />
            {CATEGORIES.map((item, index) => {
              const Icon = item.icon;
              const count = PROJECTS.filter(project => item.id === "all" || project.category === item.id).length;
              return (
                <button
                  key={item.id}
                  ref={element => { buttonsRef.current[index] = element; }}
                  id={`${variant.id}-tab-${item.id}`}
                  role="tab"
                  type="button"
                  aria-selected={active === index}
                  aria-controls={`${variant.id}-results`}
                  tabIndex={active === index ? 0 : -1}
                  onClick={() => setActive(index)}
                  onKeyDown={event => handleKeyDown(event, index)}
                  className={styles.option}
                >
                  <span className={styles.optionTop} aria-hidden="true">
                    <Icon size={19} strokeWidth={1.5} />
                    <span className={styles.optionCount}>{variant.id === "mechanical" ? count : String(count).padStart(2, "0")}</span>
                  </span>
                  <span className={styles.label}>{item.label}</span>
                  <span className={styles.selectionLine} aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>

        <div
          id={`${variant.id}-results`}
          role="tabpanel"
          aria-labelledby={`${variant.id}-tab-${category.id}`}
          tabIndex={0}
          className={styles.results}
        >
          {projects.map((project, index) => (
            <article key={`${category.id}-${project.id}`} className={styles.project} style={{ "--order": index } as CSSProperties}>
              <div className={styles.photo}>
                {/* Same preview imagery as the existing catalogue. */}
                <img
                  src={`https://images.unsplash.com/${project.image}?auto=format&fit=crop&w=600&q=80`}
                  alt={project.title}
                  loading={variant.id === "blueprint" ? "eager" : "lazy"}
                  width={600}
                  height={380}
                />
              </div>
              <h3>{project.title}</h3>
              <p>{project.location}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function FilterDemo() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href="/" className={styles.logo} aria-label="Ройстрой — главная">
            <Image src="/logo-dark.png" alt="Ройстрой" width={150} height={47} priority />
          </Link>
          <Link href="/" className={styles.back}><MoveLeft size={16} /> На сайт</Link>
        </div>
      </header>
      <div className={`${styles.intro} ${styles.inner}`}>
        <div>
          <span className={styles.eyebrow}>РОЙСТРОЙ / 2026</span>
          <h1>Варианты фильтра</h1>
        </div>
        <nav className={styles.nav} aria-label="Варианты оформления">
          {VARIANTS.map(variant => (
            <a key={variant.id} href={`#${variant.id}`}>
              <span>{variant.number}</span> {variant.name} <ArrowUpRight size={14} />
            </a>
          ))}
        </nav>
      </div>
      {VARIANTS.map(variant => <FilterVariant key={variant.id} variant={variant} />)}
    </main>
  );
}
