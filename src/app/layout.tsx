import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "РОЙСТРОЙ — строительство домов и коммерческих объектов в Крыму",
  description: "Проектирование и строительство частных домов, коттеджей и коммерческих объектов в Крыму. Работа по СП и ГОСТ, фиксированная смета, фото- и видеоотчеты по этапам.",
  keywords: [
    "строительство домов в Крыму",
    "строительство домов Симферополь",
    "Ройстрой",
    "монолитные дома Севастополь",
    "проектирование домов Крым",
    "коммерческое строительство Крым",
    "строительство под ключ ЮБК"
  ],
  openGraph: {
    title: "РОЙСТРОЙ — строительство домов и объектов в Крыму",
    description: "Проектирование, смета, договор, стройка и контроль этапов для частных и коммерческих объектов.",
    url: "https://roy-stroy.ru",
    siteName: "РОЙСТРОЙ Крым",
    locale: "ru_RU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body className="antialiased bg-[#e8e6e1] text-[#202428] min-h-screen">
        {children}
      </body>
    </html>
  );
}
