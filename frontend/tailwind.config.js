/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2A22",
        parchment: "#FBF8F1",
        leaf: "#1F5C4A",
        "leaf-dark": "#153F33",
        marigold: "#E7A233",
        sage: "#E7EEE4",
        coral: "#C1543A",
        line: "#DDD6C4",
        paper: "#FFFFFF",
        muted: "#5B6B60",
        faint: "#8A9188",
      },
      fontFamily: {
        serif: ["Fraunces", "serif"],
        sans: ["Inter", "sans-serif"],
      },
      borderRadius: {
        sm: "3px",
      },
    },
  },
  plugins: [],
};
