// next-intl v4 typed message keys: en.json is the source of truth; t("...")
// calls are compile-time checked against it. zh-HK parity is enforced by
// test/messages.test.ts.

import type en from "../messages/en.json";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof en;
    Locale: "en" | "zh-HK" | "ar";
  }
}
