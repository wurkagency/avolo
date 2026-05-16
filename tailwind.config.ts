import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand
        "primary": "#fa520f",
        "primary-deep": "#cc3a05",
        "on-primary": "#ffffff",

        // Sunshine scale
        "sunshine-300": "#ffd06a",
        "sunshine-500": "#ffb83e",
        "sunshine-700": "#ffa110",
        "sunshine-800": "#ff8105",
        "sunshine-900": "#ff8a00",
        "yellow-saturated": "#ffd900",

        // Warm surfaces
        "cream": "#fff8e0",
        "cream-light": "#fffaeb",
        "cream-deeper": "#fff0c2",
        "beige-deep": "#e6d5a8",
        "block-5": "#ffe295",
        "block-6": "#ffd900",
        "block-7": "#ff8105",

        // Ink scale (dark text)
        "ink": "#1f1f1f",
        "ink-tint": "#3d3d3d",
        "charcoal": "#2c2c2c",
        "slate": "#4a4a4a",
        "steel": "#6a6a6a",
        "stone": "#8a8a8a",
        "muted": "#a8a8a8",

        // Borders
        "hairline": "#e5e5e5",
        "hairline-soft": "#ededed",
        "hairline-strong": "#c7c7c7",

        // Surfaces
        "canvas": "#ffffff",
        "surface": "#fafafa",
        "surface-cream": "#fff8e0",
        "surface-cream-soft": "#fffaeb",
        "surface-code": "#1c1c1e",

        // On-dark
        "on-dark": "#ffffff",
        "on-dark-muted": "#a8a8a8",
        "on-cream": "#1f1f1f",

        // Semantic
        "footer-cream": "#fff8e0",
        "link": "#fa520f",

        // Error (retained for form validation)
        "error": "#ba1a1a",
        "on-error": "#ffffff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
      },

      borderRadius: {
        xs: "4px",
        sm: "6px",
        DEFAULT: "8px",
        md: "8px",
        lg: "12px",
        xl: "16px",
        xxl: "20px",
        full: "9999px",
      },

      spacing: {
        xxs: "4px",
        xs: "8px",
        sm: "12px",
        md: "16px",
        lg: "20px",
        xl: "24px",
        xxl: "32px",
        gutter: "32px",
        xxxl: "40px",
        "section-sm": "48px",
        section: "64px",
        "section-lg": "96px",
        hero: "120px",
        "section-padding": "120px",
      },

      fontFamily: {
        editorial: ["var(--font-editorial)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },

      fontSize: {
        "hero-display":  ["84px",  { lineHeight: "1.05", letterSpacing: "-1.5px", fontWeight: "400" }],
        "display-lg":    ["64px",  { lineHeight: "1.10", letterSpacing: "-1px",   fontWeight: "400" }],
        "heading-1":     ["52px",  { lineHeight: "1.15", letterSpacing: "-0.5px", fontWeight: "400" }],
        "heading-2":     ["36px",  { lineHeight: "1.20", letterSpacing: "-0.5px", fontWeight: "500" }],
        "heading-3":     ["28px",  { lineHeight: "1.25", fontWeight: "500" }],
        "heading-4":     ["22px",  { lineHeight: "1.30", fontWeight: "500" }],
        "heading-5":     ["18px",  { lineHeight: "1.40", fontWeight: "500" }],
        "subtitle":      ["18px",  { lineHeight: "1.50", fontWeight: "400" }],
        "body-lg":       ["20px",  { lineHeight: "1.60", fontWeight: "400" }],
        "body-md":       ["16px",  { lineHeight: "1.55", fontWeight: "400" }],
        "body-md-medium":["16px",  { lineHeight: "1.55", fontWeight: "500" }],
        "body-sm":       ["14px",  { lineHeight: "1.50", fontWeight: "400" }],
        "body-sm-medium":["14px",  { lineHeight: "1.50", fontWeight: "500" }],
        "caption":       ["13px",  { lineHeight: "1.40", fontWeight: "400" }],
        "caption-bold":  ["13px",  { lineHeight: "1.40", fontWeight: "600" }],
        "micro":         ["12px",  { lineHeight: "1.40", fontWeight: "500" }],
        "micro-uppercase":["11px", { lineHeight: "1.40", letterSpacing: "1px", fontWeight: "600" }],
        "button-md":     ["14px",  { lineHeight: "1.30", fontWeight: "500" }],
        "stat-display":  ["56px",  { lineHeight: "1.10", letterSpacing: "-1px", fontWeight: "400" }],
        "code-md":       ["14px",  { lineHeight: "1.50", fontWeight: "400" }],
      },

      maxWidth: {
        container: "720px",
        "container-max": "720px",
        wide: "1280px",
      },
    },
  },
  plugins: [],
};

export default config;
