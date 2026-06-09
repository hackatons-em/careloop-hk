"use client";

// Locale-bound date formatters for client components: same functions as
// lib/format.ts with the active next-intl locale pre-applied.

import { useMemo } from "react";
import { useLocale } from "next-intl";
import {
  formatDateTime as baseDateTime,
  formatDay as baseDay,
  formatDayYear as baseDayYear,
  formatDayNumber,
  type FormatLocale,
} from "./format";

export function useFormat() {
  const locale = useLocale() as FormatLocale;
  return useMemo(
    () => ({
      formatDay: (iso: string | null | undefined) => baseDay(iso, locale),
      formatDayYear: (iso: string | null | undefined) => baseDayYear(iso, locale),
      formatDateTime: (iso: string | null | undefined) => baseDateTime(iso, locale),
      formatDayNumber,
    }),
    [locale],
  );
}
