'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { hitungBadgeAdmin, type BadgeAdmin } from '@/lib/actions/badge-admin';

const INTERVAL_MS = 30_000;

/** Angka lencana sidebar admin, disegarkan tiap 30 dtk (tab terlihat), saat fokus, dan saat pindah halaman. */
export function useBadgeAdmin(awal: BadgeAdmin): BadgeAdmin {
    const [badge, setBadge] = useState(awal);
    const pathname = usePathname();
    const sibuk = useRef(false);

    useEffect(() => {
        let batal = false;
        const segarkan = async () => {
            if (sibuk.current || document.visibilityState !== 'visible') return;
            sibuk.current = true;
            try {
                const b = await hitungBadgeAdmin();
                if (!batal) setBadge(b);
            } catch { /* pertahankan angka terakhir */ }
            finally { sibuk.current = false; }
        };
        const timer = setInterval(segarkan, INTERVAL_MS);
        const saatFokus = () => { void segarkan(); };
        document.addEventListener('visibilitychange', saatFokus);
        window.addEventListener('focus', saatFokus);
        void segarkan();
        return () => {
            batal = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', saatFokus);
            window.removeEventListener('focus', saatFokus);
        };
    }, [pathname]);

    return badge;
}
