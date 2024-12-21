module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "blue-600": "#3182ce",
      },
      fontFamily: {
        jetbrains: ["JetBrains Mono", "monospace"], // Для шрифта JetBrains Mono
        montserrat: ["Montserrat", "sans-serif"], // Для шрифта Montserrat
      },
    },
  },
  plugins: [require("tailwind-scrollbar")],
};
