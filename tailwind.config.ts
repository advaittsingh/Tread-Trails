import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./contexts/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-body)",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
        heading: [
          "var(--font-heading)",
          "var(--font-body)",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      transitionTimingFunction: {
        "tt-out": "cubic-bezier(0.22, 1, 0.36, 1)",
        "tt-in-out": "cubic-bezier(0.45, 0, 0.55, 1)",
      },
      colors: {
        brand: {
          maroon: "oklch(0.42 0.13 32)",
          "maroon-light": "oklch(0.55 0.14 35)",
          gold: "oklch(0.86 0.15 95)",
          "gold-dark": "oklch(0.72 0.13 90)",
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        card:
          "0 2px 20px -6px oklch(0 0 0 / 6%), 0 8px 28px -12px oklch(0 0 0 / 5%)",
        "card-hover":
          "0 12px 40px -10px oklch(0 0 0 / 11%), 0 4px 16px -6px oklch(0 0 0 / 7%)",
        "nav-float":
          "0 1px 0 oklch(1 0 0 / 0.45) inset, 0 8px 32px -12px oklch(0.2 0.02 35 / 0.08)",
        "btn-primary":
          "0 4px 20px -4px oklch(0.42 0.13 32 / 0.38), 0 2px 8px -2px oklch(0.42 0.13 32 / 0.22)",
        "btn-primary-hover":
          "0 8px 28px -4px oklch(0.42 0.13 32 / 0.42), 0 4px 12px -2px oklch(0.42 0.13 32 / 0.25)",
      },
      backgroundImage: {
        "lux-grid":
          "linear-gradient(to right, oklch(0 0 0 / 5%) 1px, transparent 1px), linear-gradient(to bottom, oklch(0 0 0 / 5%) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "64px 64px",
      },
    },
  },
  plugins: [
    tailwindcssAnimate,
    plugin(({ addVariant }) => {
      addVariant(
        "data-open",
        '&:where([data-state="open"]), &:where([data-open]:not([data-open="false"]))'
      );
      addVariant(
        "data-closed",
        '&:where([data-state="closed"]), &:where([data-closed]:not([data-closed="false"]))'
      );
      addVariant(
        "in-data-[slot=button-group]",
        '[data-slot="button-group"] &'
      );
      addVariant(
        "has-data-[icon=inline-end]",
        "&:has([data-icon=\"inline-end\"])"
      );
      addVariant(
        "has-data-[icon=inline-start]",
        "&:has([data-icon=\"inline-start\"])"
      );
    }),
  ],
};

export default config;
