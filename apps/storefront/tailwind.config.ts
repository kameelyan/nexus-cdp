import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        apex: { DEFAULT: '#0a0a0a', accent: '#c8a96e', muted: '#6b7280' },
      },
    },
  },
  plugins: [],
};
export default config;
