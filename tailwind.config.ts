import type { Config } from 'tailwindcss';

const config: Config = {
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['var(--font-jakarta)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
            },
            colors: {
                // ── Simpatik design tokens ──────────────────────────
                // Navy: identitas utama (sidebar, tombol primer, header)
                navy: {
                    950: '#0B1A2E',
                    800: '#122A47',
                    700: '#1B3A5F',
                    600: '#254C79',
                },
                // Azure: aksen interaktif (link, focus ring, aksi sekunder)
                azure: {
                    500: '#3B82C4',
                    400: '#5FA0DB',
                },
                // Amber: aksen hangat untuk penekanan (nomor antrian, highlight)
                amber: {
                    500: '#E2984D',
                    400: '#EDB077',
                },
                // Paper: latar hangat, bukan abu-abu dingin generik
                paper: {
                    50: '#F8F7F4',
                    100: '#F1EFE9',
                    200: '#E7E3DA',
                },
            },
            boxShadow: {
                soft: '0 1px 2px 0 rgb(11 26 46 / 0.04), 0 1px 6px -1px rgb(11 26 46 / 0.06)',
                card: '0 2px 8px -2px rgb(11 26 46 / 0.08), 0 4px 24px -8px rgb(11 26 46 / 0.08)',
            },
            backgroundImage: {
                // Tekstur kertas grafik — elemen signature, dipakai terbatas
                // di area nomor antrian besar (referensi visual "data/statistik")
                'grid-dot': 'radial-gradient(circle, rgb(11 26 46 / 0.08) 1px, transparent 1px)',
            },
            backgroundSize: {
                'grid-dot': '16px 16px',
            },
        },
    },
    plugins: [],
};

export default config;
