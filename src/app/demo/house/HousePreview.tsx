"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import ModelViewer from "./ModelViewer";
import styles from "./house.module.css";

export default function HousePreview() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <h1>Дом в деталях</h1>
        <Link href="/" target="_blank" rel="noopener noreferrer" className={styles.siteLink}>Основной сайт<ArrowUpRight size={16} /></Link>
      </header>
      <ModelViewer />
    </main>
  );
}
