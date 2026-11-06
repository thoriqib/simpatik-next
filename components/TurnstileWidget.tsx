'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';

declare global {
    interface Window { turnstile?: { reset: (el?: string | HTMLElement) => void } }
}

/**
 * Captcha Cloudflare Turnstile. Widget menyisipkan input tersembunyi
 * `cf-turnstile-response` ke dalam <form> otomatis. Token sekali pakai, jadi
 * `resetKey` (mis. state hasil action) dipakai untuk meminta token baru setelah submit.
 * Tidak merender apa pun bila NEXT_PUBLIC_TURNSTILE_SITE_KEY belum diisi.
 */
export function TurnstileWidget({ resetKey }: { resetKey?: unknown }) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (resetKey && ref.current) {
            try { window.turnstile?.reset(ref.current); } catch { /* abaikan */ }
        }
    }, [resetKey]);

    if (!siteKey) return null;
    return (
        <>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
            <div ref={ref} className="cf-turnstile" data-sitekey={siteKey} data-language="id" data-theme="auto" />
        </>
    );
}
