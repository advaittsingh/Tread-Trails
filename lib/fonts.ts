import { Bricolage_Grotesque } from "next/font/google";

/** Display grotesque — ExtraBold for heroes; pairs with Satoshi body. */
export const headingFont = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700", "800"],
  display: "swap",
  adjustFontFallback: true,
});
