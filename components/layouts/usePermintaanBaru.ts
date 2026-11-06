'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { hitungPermintaanBaru } from '@/lib/actions/permintaan-baru';

const INTERVAL_MS = 30_000;

/**
 * Jumlah permintaan data baru (belum ditangani), disegarkan otomatis:
 *  - tiap 30 detik selama tab terlihat,
 *  - saat tab kembali difokuskan,
 *  - saat pindah halaman (mis. setelah mengklaim permintaan, angkanya langsung turun).
 * Nilai awal datang dari server (layout) supaya angka sudah benar sejak render pertama.
 */
export function usePermintaanBaru(awal: number): number {
    const [jumlah, setJumlah] = useState(awal);
    const pathname = usePathname();
    const sibuk = useRef(false);

    useEffect(() => {
        let batal = false;
        const segarkan = async () => {
            if (sibuk.current || document.visibilityState !== 'visible') return;
            sibuk.current = true;
            try {
                const n = await hitungPermintaanBaru();
                if (!batal) setJumlah(n);
            } catch { /* jaringan putus sesaat: pertahankan angka terakhir */ }
            finally { sibuk.current = false; }
        };
        const timer = setInterval(segarkan, INTERVAL_MS);
        const saatFokus = () => { void segarkan(); };
        document.addEventListener('visibilitychange', saatFokus);
        window.addEventListener('focus', saatFokus);
        void segarkan(); // juga saat pindah halaman (pathname berubah)
        return () => {
            batal = true;
            clearInterval(timer);
            document.removeEventListener('visibilitychange', saatFokus);
            window.removeEventListener('focus', saatFokus);
        };
    }, [pathname]);

    return jumlah;
}
