import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        nexus: { DEFAULT: '#0f172a', accent: '#6366f1', muted: '#94a3b8' },
      },
    },
  },
  plugins: [],
};
export default config;
