// Arabic glyph support for the server-side @react-pdf PDFs.
//
// The PDFs are English / Helvetica / LTR by design (standard for HK hospital
// administration, and it keeps the layout deterministic). react-pdf's built-in
// Helvetica has NO Arabic glyphs, so an Arabic patient / org / nurse name would
// render as tofu. We register a vendored static Noto Naskh Arabic (Regular +
// Bold) and apply it ONLY to the specific user-provided fields that may contain
// Arabic — Latin text stays crisp in Helvetica, and the document is never
// mirrored. The TTFs are bundled into the PDF route functions via
// `outputFileTracingIncludes` in next.config.ts.

import path from "node:path";
import { Font } from "@react-pdf/renderer";

let registered = false;

function ensureArabicFonts(): void {
  if (registered) return;
  const dir = path.join(process.cwd(), "lib", "pdf-fonts");
  Font.register({ family: "NotoNaskhArabic", src: path.join(dir, "NotoNaskhArabic-Regular.ttf") });
  Font.register({ family: "NotoNaskhArabicBold", src: path.join(dir, "NotoNaskhArabic-Bold.ttf") });
  // Arabic words must never be split mid-word.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

// Arabic block + Arabic Supplement.
const ARABIC = /[؀-ۿݐ-ݿ]/;

/**
 * Font family for a (possibly user-provided) PDF string. Returns the Arabic
 * face only when the text actually contains Arabic script — so Latin/English
 * content keeps Helvetica. Pass `useArabic: false` (the bidi-fallback path) to
 * force Helvetica everywhere.
 */
export function pdfFontFor(
  text: string,
  opts?: { bold?: boolean; useArabic?: boolean },
): string {
  const bold = opts?.bold ?? false;
  const useArabic = opts?.useArabic ?? true;
  if (useArabic && ARABIC.test(text)) {
    ensureArabicFonts();
    return bold ? "NotoNaskhArabicBold" : "NotoNaskhArabic";
  }
  return bold ? "Helvetica-Bold" : "Helvetica";
}
