import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        display: ["var(--font-poppins)", "Poppins", "sans-serif"],
      },
      aspectRatio: {
        "248/298": "248 / 298",
        "298/398": "298 / 398",
        "398/498": "398 / 498",
        "498/698": "498 / 698",
      },
    },
  },
  plugins: [],
};
export default config;
