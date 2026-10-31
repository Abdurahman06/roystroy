export const COMPANY = {
  name: "Ройстрой",
  phonePrimary: "+7 (978) 684-98-67",
  phonePrimaryHref: "tel:+79786849867",
  whatsappHref: "https://wa.me/79786849867",
  instagramHref: "https://www.instagram.com/roystroy.crimea/",
  address: "Крым, Симферопольский район, село Строгоновка, улица Озенбаш, 5",
  workHours: "Пн-Пт, 9:00-18:00",
};

export function buildWhatsAppLeadUrl(message: string) {
  return `${COMPANY.whatsappHref}?text=${encodeURIComponent(message)}`;
}
