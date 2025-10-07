/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          coral: '#F2734B',      /* Vibrant coral-orange */
          peach: '#FFB088',      /* Soft peach */
          teal: '#26B5A6',       /* Fresh teal */
          mint: '#8DD9CC',       /* Light mint */
          lavender: '#B794F6',   /* Playful lavender */
          sunshine: '#FFD966',   /* Warm yellow */
          rose: '#FF6B9D',       /* Cheerful pink */
        },
        success: {
          DEFAULT: '#26B5A6',    /* Fresh teal */
          light: '#8DD9CC',      /* Light mint */
          dark: '#1A9185',       /* Deep teal */
        },
        warning: {
          DEFAULT: '#FFB366',    /* Warm orange */
          light: '#FFCF99',      /* Light orange */
          dark: '#F28B33',       /* Deep orange */
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}