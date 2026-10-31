import type { Metadata } from "next";
import HousePreview from "./HousePreview";

export const metadata: Metadata = {
  title: "Дом в деталях | Ройстрой",
  robots: { index: false, follow: false },
};

export default function HousePreviewPage() {
  return <HousePreview />;
}
