// next-intl request config (App Router, no i18n routing): the active locale
// comes from the careloop_locale cookie; absent/invalid -> English. Loaded
// once per request by the createNextIntlPlugin wiring in next.config.ts.

import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "./config";

export default getRequestConfig(async () => {
  const raw = (await cookies()).get(LOCALE_COOKIE)?.value;
  const locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
