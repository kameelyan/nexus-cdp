import type { Config } from 'tailwindcss';
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        rewards: { DEFAULT: '#1a1a2e', accent: '#e94560', gold: '#f5c518' },
      },
    },
  },
  plugins: [],
};
export default config;
