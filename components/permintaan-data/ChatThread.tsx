'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { kirimPesanPetugas, selesaikanPermintaan } from '@/lib/actions/permintaan-data';
import { ConfirmModal } from '@/components/ui/Modal';
import { Send, CheckCheck, RefreshCw } from 'lucide-react';
import type { PermintaanDataPesan } from '@/lib/types/database';

/**
 * Chat thread untuk sisi petugas/admin. Dipakai bersama di halaman
 * admin & petugas — perbedaan hak akses (siapa boleh kirim/selesaikan)
 * sudah divalidasi di server action, komponen ini cuma render + kirim.
 *
 * [FIX BUG PRESENSI — pelajaran dipakai ulang di sini] router.refresh()
 * terbukti tidak selalu andal memaksa Server Component induk mengambil
 * data terbaru. Pesan yang BARU DIKIRIM langsung ditambahkan ke STATE
 * LOKAL (optimistic append, memakai teks yang memang baru saja dikirim)
 * — tidak menunggu refetch apa pun. Untuk melihat balasan pihak lain,
 * tombol "Muat ulang" memakai window.location.reload() (bukan
 * router.refresh()) yang terbukti selalu mengambil data segar.
 */
export function ChatThread({
    permintaanId,
    pesanAwal,
    namaPengunjung,
    bisaKirim,
    bisaSelesaikan,
}: {
    permintaanId: number;
    pesanAwal: PermintaanDataPesan[];
    namaPengunjung: string;
    bisaKirim: boolean;
    bisaSelesaikan: boolean;
}) {
    const [isPending, startTransition] = useTransition();
    const [pesanList, setPesanList] = useState<PermintaanDataPesan[]>(pesanAwal);
    const [teks, setTeks] = useState('');
    const [error, setError] = useState('');
    const [confirmSelesai, setConfirmSelesai] = useState(false);
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
            const res = await kirimPesanPetugas(permintaanId, teksKirim);
            if (res?.error) {
                setError(res.error);
                return;
            }
            // Optimistic append — pakai teks yang memang baru saja dikirim,
            // bukan nunggu refetch (lihat catatan di atas komponen).
            setPesanList((prev) => [
                ...prev,
                {
                    id: -Date.now(), // id sementara, negatif supaya tidak bentrok id asli dari server
                    permintaan_data_id: permintaanId,
                    pengirim: 'petugas',
                    petugas_id: null,
                    pesan: teksKirim,
                    created_at: new Date().toISOString(),
                },
            ]);
            setTeks('');
        });
    }

    function handleSelesaikan() {
        startTransition(async () => {
            const res = await selesaikanPermintaan(permintaanId);
            setConfirmSelesai(false);
            if (res?.error) {
                setError(res.error);
                return;
            }
            window.location.reload();
        });
    }

    return (
        <div>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}

            <div className="border border-paper-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-paper-50">
                    {pesanList.length > 0 ? pesanList.map((p) => (
                        <div key={p.id} className={`flex ${p.pengirim === 'petugas' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                p.pengirim === 'petugas' ? 'bg-navy-700 text-white rounded-br-sm' : 'bg-white border border-paper-200 text-navy-950 rounded-bl-sm'
                            }`}>
                                <div className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">
                                    {p.pengirim === 'petugas' ? 'Anda/Petugas' : namaPengunjung}
                                </div>
                                <div className="whitespace-pre-line leading-relaxed">{p.pesan}</div>
                                <div className={`text-[10px] mt-1 ${p.pengirim === 'petugas' ? 'text-white/50' : 'text-navy-950/40'}`}>
                                    {new Date(p.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-navy-950/30 text-sm py-6">Belum ada percakapan.</p>
                    )}
                    <div ref={bawahRef} />
                </div>

                {bisaKirim && (
                    <form onSubmit={handleKirim} className="border-t border-paper-200 bg-white p-3 flex gap-2">
                        <input
                            value={teks}
                            onChange={(e) => setTeks(e.target.value)}
                            maxLength={2000}
                            placeholder="Tulis balasan..."
                            disabled={isPending}
                            className="flex-1 border border-paper-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500"
                        />
                        <button type="submit" disabled={isPending || !teks.trim()}
                            className="inline-flex items-center gap-1.5 bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors disabled:opacity-50">
                            <Send className="w-4 h-4" />
                        </button>
                    </form>
                )}
            </div>

            <div className="flex items-center justify-between mt-3">
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-1.5 text-xs text-navy-950/50 hover:text-navy-950 transition-colors"
                >
                    <RefreshCw className="w-3.5 h-3.5" /> Muat ulang percakapan
                </button>

                {bisaSelesaikan && (
                    <button
                        onClick={() => setConfirmSelesai(true)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 bg-emerald-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                        <CheckCheck className="w-4 h-4" /> Tandai Selesai
                    </button>
                )}
            </div>

            <ConfirmModal
                open={confirmSelesai}
                onClose={() => setConfirmSelesai(false)}
                onConfirm={handleSelesaikan}
                pending={isPending}
                title="Tandai Selesai?"
                message="Percakapan akan ditutup — pengunjung tidak bisa mengirim pesan lagi setelah ini. Riwayat chat tetap tersimpan sebagai catatan tanggapan."
            />
        </div>
    );
}
