'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, X, Loader2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { setujuiGantiJadwal, tolakGantiJadwal } from '@/lib/actions/ganti-jadwal';

export function KeputusanButtons({ requestId, namaPemohon }: { requestId: number; namaPemohon: string }) {
    const router = useRouter();
    const [mode, setMode] = useState<'setuju' | 'tolak' | null>(null);
    const [catatan, setCatatan] = useState('');
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    function tutup() { if (!isPending) { setMode(null); setError(''); setCatatan(''); } }

    function handleKirim(e: React.FormEvent) {
        e.preventDefault();
        if (!mode) return;
        setError('');
        startTransition(async () => {
            const res = mode === 'setuju' ? await setujuiGantiJadwal(requestId, catatan) : await tolakGantiJadwal(requestId, catatan);
            if (res.error) { setError(res.error); return; }
            setMode(null); setCatatan('');
            router.refresh();
        });
    }

    const setuju = mode === 'setuju';

    return (
        <>
            <div className="flex gap-2">
                <button onClick={() => setMode('setuju')} className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-emerald-700 transition-colors">
                    <Check className="w-3.5 h-3.5" /> Setujui
                </button>
                <button onClick={() => setMode('tolak')} className="inline-flex items-center gap-1.5 bg-white text-rose-600 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-rose-50 transition-colors">
                    <X className="w-3.5 h-3.5" /> Tolak
                </button>
            </div>

            <Modal open={mode !== null} onClose={tutup} title={`${setuju ? 'Setujui' : 'Tolak'} Request — ${namaPemohon}`}>
                <form onSubmit={handleKirim} className="space-y-4">
                    {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
                    {setuju && <p className="text-sm text-navy-950/60">Jadwal piket akan langsung diubah sesuai request ini.</p>}
                    <div>
                        <label className="block text-sm font-medium text-navy-950 mb-1.5">
                            Catatan untuk petugas <span className="text-navy-950/40 font-normal">(opsional)</span>
                        </label>
                        <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} disabled={isPending} rows={3} maxLength={300}
                            className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm resize-none disabled:opacity-60" />
                    </div>
                    <button type="submit" disabled={isPending}
                        className={`w-full inline-flex items-center justify-center gap-2 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 ${setuju ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>
                        {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                        {isPending ? 'Memproses...' : setuju ? 'Setujui & Ubah Jadwal' : 'Tolak Request'}
                    </button>
                </form>
            </Modal>
        </>
    );
}
