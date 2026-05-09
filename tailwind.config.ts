import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";
import plugin from "tailwindcss/plugin";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
        heading: ["var(--font-heading)", "system-ui", "sans-serif"],
      },
      colors: {
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
          "0 4px 24px -8px oklch(0 0 0 / 7%), 0 2px 8px -4px oklch(0 0 0 / 5%)",
        "card-hover":
          "0 14px 40px -12px oklch(0 0 0 / 12%), 0 6px 16px -6px oklch(0 0 0 / 8%)",
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
