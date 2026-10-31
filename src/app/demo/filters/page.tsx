import type { Metadata } from "next";
import FilterDemo from "./FilterDemo";

export const metadata: Metadata = {
  title: "Варианты фильтра | Ройстрой",
  robots: { index: false, follow: false },
};

export default function FilterDemoPage() {
  return <FilterDemo />;
}
