// Tailwind CSS v4 は PostCSS プラグイン経由。tailwind.config.js は不要で、
// テーマは src/app/globals.css の @theme ブロックに CSS として書く。
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
