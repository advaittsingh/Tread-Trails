import { Bricolage_Grotesque } from "next/font/google";

/** Display grotesque for heroes, categories, and card titles — pairs with Satoshi body. */
export const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  axes: ["opsz", "wdth"],
  display: "swap",
  adjustFontFallback: true,
});
