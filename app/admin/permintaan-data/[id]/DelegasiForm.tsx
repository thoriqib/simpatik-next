'use client';

import { useState, useTransition } from 'react';
import { delegasikanPermintaanData } from '@/lib/actions/permintaan-data';
import { UserCheck } from 'lucide-react';

export function DelegasiForm({ id, petugasList }: { id: number; petugasList: { id: string; name: string }[] }) {
    const [petugasId, setPetugasId] = useState(petugasList[0]?.id ?? '');
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    function handleDelegasikan() {
        if (!petugasId) return;
        setError('');
        startTransition(async () => {
            const res = await delegasikanPermintaanData(id, petugasId);
            if (res?.error) {
                setError(res.error);
                return;
            }
            // [FIX] Konsisten dengan perbaikan di PresensiPanel — reload penuh
            // menjamin data ditangani_oleh terbaru benar-benar termuat.
            window.location.reload();
        });
    }

    return (
        <div className="bg-paper-50 rounded-xl p-4">
            <p className="text-xs text-navy-950/50 mb-3">
                Alih-alih menanggapi sendiri, Anda bisa menugaskan petugas tertentu untuk
                menindaklanjuti permintaan ini. Status otomatis jadi &quot;Diproses&quot;.
            </p>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <div className="flex flex-wrap gap-2 items-center">
                <select
                    value={petugasId}
                    onChange={(e) => setPetugasId(e.target.value)}
                    className="border border-paper-200 rounded-xl px-3 py-2 text-sm bg-white flex-1 min-w-40"
                >
                    {petugasList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <button
                    onClick={handleDelegasikan}
                    disabled={isPending || !petugasId}
                    className="inline-flex items-center gap-1.5 bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50"
                >
                    <UserCheck className="w-4 h-4" />
                    {isPending ? 'Memproses...' : 'Delegasikan'}
                </button>
            </div>
        </div>
    );
}
