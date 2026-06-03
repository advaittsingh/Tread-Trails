import { Bricolage_Grotesque, Manrope } from "next/font/google";

/**
 * Display: Bricolage Grotesque (ExtraBold for heroes).
 * Fallback in stack: Manrope ExtraBold — same expedition utility, cleaner geometry.
 */
export const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
});

/** Body, navigation, UI — Medium / Regular for premium automotive rhythm. */
export const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
});
