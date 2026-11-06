'use client';

import { useEffect, useRef } from 'react';

type TurnstileApi = {
    render: (el: HTMLElement, opts: Record<string, unknown>) => string;
    reset: (id?: string) => void;
    remove: (id?: string) => void;
};
declare global {
    interface Window { turnstile?: TurnstileApi }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

// Skrip dimuat SEKALI (promise dipakai bersama). Render memakai mode eksplisit, supaya
// widget tetap muncul setelah pindah halaman lewat navigasi client-side (tanpa refresh) —
// mode otomatis hanya memindai halaman sekali saat skrip pertama dimuat.
let scriptPromise: Promise<TurnstileApi> | null = null;
function muatSkrip(): Promise<TurnstileApi> {
    if (typeof window === 'undefined') return Promise.reject();
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!scriptPromise) {
        scriptPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
            s.async = true;
            s.onload = () => (window.turnstile ? resolve(window.turnstile) : reject());
            s.onerror = () => { scriptPromise = null; reject(); };
            document.head.appendChild(s);
        });
    }
    return scriptPromise;
}

/**
 * Captcha Cloudflare Turnstile.
 * - `onVerifiedChange(true)` saat lolos, `false` saat belum/kedaluwarsa/gagal → dipakai form
 *   untuk menonaktifkan tombol kirim.
 * - `resetKey` (mis. state hasil action) meminta token baru, karena token hanya sekali pakai.
 * - Site key kosong → captcha nonaktif; komponen tidak merender apa pun.
 */
export function TurnstileWidget({ onVerifiedChange, resetKey }: {
    onVerifiedChange: (ok: boolean) => void;
    resetKey?: unknown;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const cb = useRef(onVerifiedChange);
    cb.current = onVerifiedChange;

    useEffect(() => {
        if (!TURNSTILE_SITE_KEY || !ref.current) return;
        let batal = false;
        muatSkrip().then((api) => {
            if (batal || !ref.current) return;
            widgetId.current = api.render(ref.current, {
                sitekey: TURNSTILE_SITE_KEY,
                language: 'id',
                theme: 'auto',
                callback: () => cb.current(true),
                'expired-callback': () => cb.current(false),
                'timeout-callback': () => cb.current(false),
                'error-callback': () => cb.current(false),
            });
        }).catch(() => cb.current(false));
        return () => {
            batal = true;
            if (widgetId.current) {
                try { window.turnstile?.remove(widgetId.current); } catch { /* abaikan */ }
                widgetId.current = null;
            }
        };
    }, []);

    useEffect(() => {
        if (resetKey && widgetId.current) {
            cb.current(false);
            try { window.turnstile?.reset(widgetId.current); } catch { /* abaikan */ }
        }
    }, [resetKey]);

    if (!TURNSTILE_SITE_KEY) return null;
    return <div ref={ref} className="min-h-[65px]" />;
}
