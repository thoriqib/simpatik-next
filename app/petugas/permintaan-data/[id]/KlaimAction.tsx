'use client';

import { useState, useTransition } from 'react';
import { tindakLanjutiPermintaanData, ambilAlihPermintaanData } from '@/lib/actions/permintaan-data';
import { UserPlus, RefreshCcw } from 'lucide-react';

export function KlaimAction({ id, mode }: { id: number; mode: 'klaim' | 'ambil-alih' }) {
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    function handleClick() {
        setError('');
        startTransition(async () => {
            const res = mode === 'klaim' ? await tindakLanjutiPermintaanData(id) : await ambilAlihPermintaanData(id);
            if (res?.error) {
                setError(res.error);
                return;
            }
            // [FIX] Konsisten dengan perbaikan di PresensiPanel — router.refresh()
            // saja terbukti tidak selalu andal memaksa Server Component induk
            // mengambil ulang data terbaru. Reload penuh menjamin data segar.
            window.location.reload();
        });
    }

    return (
        <div>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <button
                onClick={handleClick}
                disabled={isPending}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50 ${
                    mode === 'klaim' ? 'bg-navy-700 text-white hover:bg-navy-800' : 'bg-amber-500 text-white hover:bg-amber-500/90'
                }`}
            >
                {mode === 'klaim' ? <UserPlus className="w-4 h-4" /> : <RefreshCcw className="w-4 h-4" />}
                {isPending ? 'Memproses...' : mode === 'klaim' ? 'Tindak Lanjuti' : 'Ambil Alih'}
            </button>
        </div>
    );
}
