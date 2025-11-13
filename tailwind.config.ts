import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      colors: {
        primary: '#5C6CFF',
        danger: '#FF6B6B',
        success: '#1DD1A1',
        surface: '#10121A',
        outline: '#1F2230'
      },
      borderRadius: {
        control: '1rem'
      }
    }
  },
  plugins: []
} satisfies Config;
