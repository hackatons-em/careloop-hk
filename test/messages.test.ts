import { describe, expect, it } from "vitest";
import en from "../messages/en.json";
import zhHK from "../messages/zh-HK.json";

/** Flatten nested message objects to dot-paths. */
function keysOf(obj: Record<string, unknown>, prefix = ""): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const path = prefix ? `${prefix}.${k}` : k;
    if (v !== null && typeof v === "object") {
      return keysOf(v as Record<string, unknown>, path);
    }
    return [path];
  });
}

describe("message catalog parity", () => {
  const enKeys = new Set(keysOf(en));
  const zhKeys = new Set(keysOf(zhHK));

  it("zh-HK has every English key", () => {
    const missing = [...enKeys].filter((k) => !zhKeys.has(k));
    expect(missing).toEqual([]);
  });

  it("zh-HK has no extra keys", () => {
    const extra = [...zhKeys].filter((k) => !enKeys.has(k));
    expect(extra).toEqual([]);
  });

  it("no empty translations in either catalog", () => {
    const emptyEn = keysOf(en).filter((k) => {
      const v = k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], en);
      return typeof v === "string" && v.trim() === "";
    });
    const emptyZh = keysOf(zhHK).filter((k) => {
      const v = k.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], zhHK);
      return typeof v === "string" && v.trim() === "";
    });
    expect(emptyEn).toEqual([]);
    expect(emptyZh).toEqual([]);
  });
});
