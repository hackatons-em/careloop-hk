import { describe, expect, it } from "vitest";
import ar from "../messages/ar.json";
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

/** Every {placeholder} token in the English source must survive translation. */
function placeholders(s: string): string[] {
  return (s.match(/\{[a-zA-Z0-9_]+\}/g) ?? []).sort();
}
function leaf(cat: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((o, p) => (o as Record<string, unknown>)?.[p], cat);
}

describe("message catalog parity", () => {
  const enKeys = new Set(keysOf(en));
  const zhKeys = new Set(keysOf(zhHK));
  const arKeys = new Set(keysOf(ar));

  it("zh-HK has every English key", () => {
    expect([...enKeys].filter((k) => !zhKeys.has(k))).toEqual([]);
  });

  it("zh-HK has no extra keys", () => {
    expect([...zhKeys].filter((k) => !enKeys.has(k))).toEqual([]);
  });

  it("ar has every English key", () => {
    expect([...enKeys].filter((k) => !arKeys.has(k))).toEqual([]);
  });

  it("ar has no extra keys", () => {
    expect([...arKeys].filter((k) => !enKeys.has(k))).toEqual([]);
  });

  it("no empty translations in any catalog", () => {
    for (const [name, cat] of [["en", en], ["zh-HK", zhHK], ["ar", ar]] as const) {
      const empty = keysOf(cat).filter((k) => {
        const v = leaf(cat, k);
        return typeof v === "string" && v.trim() === "";
      });
      expect(empty, `${name} has empty values`).toEqual([]);
    }
  });

  it("ar preserves every English interpolation placeholder", () => {
    const mismatches = [...enKeys].filter((k) => {
      const e = leaf(en, k);
      const a = leaf(ar, k);
      if (typeof e !== "string" || typeof a !== "string") return false;
      return JSON.stringify(placeholders(e)) !== JSON.stringify(placeholders(a));
    });
    expect(mismatches).toEqual([]);
  });
});
