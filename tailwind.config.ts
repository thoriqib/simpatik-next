import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                bps: { DEFAULT: '#003580', dark: '#002a66' },
            },
        },
    },
    plugins: [],
};

export default config;
