// Locale configuration. CareLoop ships English + Traditional Chinese (Hong
// Kong). Locale selection is cookie-based — URLs never change, so the proxy,
// robots/sitemap, and deep links are locale-agnostic.

export const LOCALES = ["en", "zh-HK"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "careloop_locale";

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}
