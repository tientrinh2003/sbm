import type { Config } from "tailwindcss";
export default {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: { xl: "1rem", "2xl": "1.25rem" },
      boxShadow: { card: "0 6px 20px -6px rgba(15,23,42,.08)" }
    }
  },
  plugins: []
} satisfies Config;
