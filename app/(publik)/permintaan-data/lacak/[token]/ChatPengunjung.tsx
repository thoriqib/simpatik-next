'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { kirimPesanPengunjungPublik } from '@/lib/actions/permintaan-data';
import { Send, RefreshCw } from 'lucide-react';
import type { PermintaanDataPesan } from '@/lib/types/database';

/**
 * Chat pengunjung di halaman lacak (publik, tanpa login, akses via token).
 * Pola sama seperti ChatThread admin/petugas — pesan sendiri langsung
 * ditambahkan ke state lokal (optimistic), refresh manual pakai reload
 * penuh untuk lihat balasan petugas (lihat catatan lengkap di ChatThread.tsx).
 */
export function ChatPengunjung({
    token,
    pesanAwal,
    aktif,
}: {
    token: string;
    pesanAwal: PermintaanDataPesan[];
    aktif: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [pesanList, setPesanList] = useState<PermintaanDataPesan[]>(pesanAwal);
    const [teks, setTeks] = useState('');
    const [error, setError] = useState('');
    const bawahRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bawahRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [pesanList.length]);

    function handleKirim(e: React.FormEvent) {
        e.preventDefault();
        const teksKirim = teks.trim();
        if (!teksKirim) return;
        setError('');

        startTransition(async () => {
            const res = await kirimPesanPengunjungPublik(token, teksKirim);
            if (res?.error) {
                setError(res.error);
                return;
            }
            setPesanList((prev) => [
                ...prev,
                {
                    id: -Date.now(),
                    permintaan_data_id: 0,
                    pengirim: 'pengunjung',
                    petugas_id: null,
                    pesan: teksKirim,
                    created_at: new Date().toISOString(),
                },
            ]);
            setTeks('');
        });
    }

    return (
        <div>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}

            <div className="border border-paper-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-paper-50">
                    {pesanList.length > 0 ? pesanList.map((p) => (
                        <div key={p.id} className={`flex ${p.pengirim === 'pengunjung' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                p.pengirim === 'pengunjung' ? 'bg-azure-500 text-white rounded-br-sm' : 'bg-white border border-paper-200 text-navy-950 rounded-bl-sm'
                            }`}>
                                <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                                    {p.pengirim === 'pengunjung' ? 'Anda' : 'Petugas BPS'}
                                </div>
                                <div className="whitespace-pre-line leading-relaxed">{p.pesan}</div>
                                <div className={`text-[10px] mt-1 ${p.pengirim === 'pengunjung' ? 'text-white/60' : 'text-navy-950/40'}`}>
                                    {new Date(p.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-navy-950/30 text-sm py-6">Belum ada percakapan.</p>
                    )}
                    <div ref={bawahRef} />
                </div>

                {aktif && (
                    <form onSubmit={handleKirim} className="border-t border-paper-200 bg-white p-3 flex gap-2">
                        <input
                            value={teks}
                            onChange={(e) => setTeks(e.target.value)}
                            maxLength={2000}
                            placeholder="Tulis pesan..."
                            disabled={isPending}
                            className="flex-1 border border-paper-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500"
                        />
                        <button type="submit" disabled={isPending || !teks.trim()}
                            className="inline-flex items-center gap-1.5 bg-azure-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-azure-500/90 transition-colors disabled:opacity-50">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                )}
            </div>

            <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-1.5 text-xs text-navy-950/50 hover:text-navy-950 transition-colors mt-3"
            >
                <RefreshCw className="w-3.5 h-3.5" /> Muat ulang untuk cek balasan terbaru
            </button>
        </div>
    );
}
