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
        primary: {
          orange: "#E9842F",
        },
        background: {
          light: "#FFFAF4",
          dark: "#262626",
          section: "rgba(255, 255, 255, 0.03)",
        },
        border: {
          light: "#E9E8E8",
          divider: "#EAEAEA",
        },
        text: {
          dark: "#393939",
          gray: "#757575",
        },
        gray: {
          section: "#444444",
        },
        accent: {
          purple: "#8A38F5",
        },
      },
      fontFamily: {
        kokila: ["Kokila", "serif"],
        inter: ["Inter", "sans-serif"],
        "general-sans": ["General Sans Variable", "sans-serif"],
        switzer: ["Switzer", "sans-serif"],
      },
      borderRadius: {
        sm: "6px",
        md: "10px",
        lg: "12px",
        xl: "16px",
      },
      boxShadow: {
        sm: "4px 4px 5.1px rgba(0, 0, 0, 0.04)",
        md: "0 4px 6px rgba(0, 0, 0, 0.1)",
        lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        bounce: "bounce 1s infinite",
      },
      keyframes: {
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
