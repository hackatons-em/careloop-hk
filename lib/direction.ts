// Text direction helper. Arabic (MSA) is the only right-to-left locale Miruwa
// ships; English and Traditional Chinese are left-to-right. Kept in one place so
// the root layout, caregiver alert, and PDF renderers all agree.

export type Dir = "ltr" | "rtl";

const RTL_LOCALES = new Set(["ar"]);

/** Map a locale (or the short message-language code used by the caregiver/
 * WhatsApp layers) to its writing direction. Unknown values default to LTR. */
export function getDir(locale: string | null | undefined): Dir {
  return locale && RTL_LOCALES.has(locale) ? "rtl" : "ltr";
}

export function isRtl(locale: string | null | undefined): boolean {
  return getDir(locale) === "rtl";
}
