'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';

/**
 * Memicu window.print() otomatis SEKALI saat pengunjung baru saja
 * mengambil nomor antrian (ditandai query param ?cetak=1 dari redirect
 * di lib/actions/antrian.ts). Query param langsung dibersihkan dari URL
 * setelahnya (router.replace) supaya refresh/reload halaman berikutnya
 * TIDAK memicu dialog print berulang — hanya sekali di kunjungan pertama.
 */
export function AutoPrint() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (searchParams.get('cetak') === '1') {
            // Bersihkan query param dari URL/histori terlebih dahulu
            router.replace(pathname);
            // Beri jeda singkat agar konten tiket sudah ter-render sempurna
            const timer = setTimeout(() => window.print(), 400);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router, pathname]);

    return null;
}
