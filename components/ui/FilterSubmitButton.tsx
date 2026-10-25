'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Tombol submit untuk form filter `method="GET"` (navigasi penuh halaman).
 * useFormStatus tidak bekerja untuk GET native, jadi spinner dipicu saat
 * diklik dan dibersihkan otomatis begitu halaman baru termuat. Tombol
 * sengaja TIDAK di-disable supaya submit tidak pernah ikut terblokir.
 */
export function FilterSubmitButton({ children = 'Tampilkan', className = 'bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors' }: { children?: ReactNode; className?: string }) {
    const [loading, setLoading] = useState(false);

    // Kembali lewat tombol "back" bisa memulihkan halaman dari bfcache dengan state lama
    useEffect(() => {
        const reset = () => setLoading(false);
        window.addEventListener('pageshow', reset);
        return () => window.removeEventListener('pageshow', reset);
    }, []);

    return (
        <button type="submit" onClick={() => setLoading(true)} aria-busy={loading}
            className={`inline-flex items-center gap-2 ${className}`}>
            {loading && <Spinner />}
            {loading ? 'Memuat...' : children}
        </button>
    );
}
