/** Company facts used across the site and in structured data. Single source of truth. */
export const SITE = {
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tunglamfood.my").replace(/\/$/, ""),
  name: "Tung Lam Food",
  legalName: "TUNG LAM FOOD INDUSTRIES SDN BHD",
  registrationNo: "200701029326 (787350-V)",
  foundingYear: 1999,
  email: "sales@tunglamfood.com",
  phone: "+60165240268",
  phoneDisplay: "+60 16-524 0268",
  whatsapp: "60165240268",
  address: {
    street: "3, Persiaran Perusahaan Kledang Utara 1/1, Kawasan Perindustrian Chandan Raya",
    locality: "Menglembu",
    region: "Perak",
    postalCode: "31450",
    country: "MY",
    countryName: "Malaysia",
  },
  geo: { lat: 4.5803, lng: 101.043877 },
  mapsUrl: "https://www.google.com/maps/search/?api=1&query=4.580300,101.043877",
  certifications: ["Halal", "HACCP", "GMP", "MeSTI"] as const,
  legacyDomain: "https://www.tunglamfood.com",
} as const;

export const fullAddress = `${SITE.address.street}, ${SITE.address.postalCode} ${SITE.address.locality}, ${SITE.address.region}, ${SITE.address.countryName}`;

export function whatsappLink(text?: string) {
  const base = `https://wa.me/${SITE.whatsapp}`;
  return text ? `${base}?text=${encodeURIComponent(text)}` : base;
}
