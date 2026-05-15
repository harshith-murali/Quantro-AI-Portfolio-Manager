import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/lib/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        gold: '#cfab67',
        text: '#f4efe6',
        muted: 'rgba(244,239,230,0.68)',
        faint: 'rgba(244,239,230,0.32)'
      },
      fontFamily: {
        serifDisplay: ['var(--font-display)', 'serif'],
        sansBody: ['var(--font-body)', 'sans-serif']
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-33.333333%)' },
        }
      },
      animation: {
        ticker: 'ticker 20s linear infinite',
      }
    }
  },
  plugins: []
};

export default config;