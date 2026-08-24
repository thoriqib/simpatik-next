'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { kirimPesanPenguduPublik } from '@/lib/actions/pengaduan';
import { cekDalamJamPelayananClient } from '@/lib/jam-pelayanan-client';
import { Send, RefreshCw, Circle, Clock } from 'lucide-react';
import type { PengaduanPesan } from '@/lib/types/database';

/**
 * Chat pengadu di halaman lacak (publik, tanpa login, akses via token).
 * Tetap ANONIM sepenuhnya — tidak ada nama/email pengadu tersimpan di
 * mana pun, token acak inilah satu-satunya "identitas".
 *
 * [REALTIME] Broadcast from Database — sama prinsipnya dengan
 * ChatPengunjung (permintaan data): topik privat dari token itu
 * sendiri, karena publik tidak pernah punya akses SELECT langsung ke
 * tabel manapun.
 */
export function ChatPengadu({
    token,
    pesanAwal,
    aktif,
    jamMulai,
    jamSelesai,
}: {
    token: string;
    pesanAwal: PengaduanPesan[];
    aktif: boolean;
    jamMulai: string;
    jamSelesai: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [pesanList, setPesanList] = useState<PengaduanPesan[]>(pesanAwal);
    const [teks, setTeks] = useState('');
    const [error, setError] = useState('');
    const [live, setLive] = useState(false);
    const [dalamJamPelayanan, setDalamJamPelayanan] = useState(true);
    const bawahRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bawahRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [pesanList.length]);

    useEffect(() => {
        const cek = () => setDalamJamPelayanan(cekDalamJamPelayananClient(jamMulai, jamSelesai));
        cek();
        const interval = setInterval(cek, 30_000);
        return () => clearInterval(interval);
    }, [jamMulai, jamSelesai]);

    useEffect(() => {
        const supabase = createClient();
        const channel = supabase
            .channel(`pengaduan:${token}`, { config: { private: true } })
            .on('broadcast', { event: 'INSERT' }, (payload) => {
                const rec = (payload.payload?.record ?? payload.payload?.new ?? payload.new) as PengaduanPesan | undefined;
                if (rec?.id) {
                    setPesanList((prev) => (prev.some((p) => p.id === rec.id) ? prev : [...prev, rec]));
                }
            })
            .subscribe((status) => setLive(status === 'SUBSCRIBED'));

        return () => { supabase.removeChannel(channel); };
    }, [token]);

    function handleKirim(e: React.FormEvent) {
        e.preventDefault();
        const teksKirim = teks.trim();
        if (!teksKirim) return;
        setError('');

        startTransition(async () => {
            const res = await kirimPesanPenguduPublik(token, teksKirim);
            if (res?.error) {
                setError(res.error);
                return;
            }
            setTeks('');
        });
    }

    const kirimAktif = aktif && dalamJamPelayanan;

    return (
        <div>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}

            {aktif && (
                <div className="flex items-center gap-1.5 mb-2 text-xs">
                    <Circle className={`w-2 h-2 ${live ? 'fill-emerald-500 text-emerald-500' : 'fill-navy-950/20 text-navy-950/20'}`} />
                    <span className={live ? 'text-emerald-600 font-medium' : 'text-navy-950/40'}>{live ? 'Live — balasan admin muncul otomatis' : 'Menghubungkan...'}</span>
                </div>
            )}

            {aktif && !dalamJamPelayanan && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3.5 py-2.5 text-xs mb-3">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    Percakapan hanya aktif pada jam pelayanan ({jamMulai}–{jamSelesai} WIB). Anda tetap bisa membaca riwayat, silakan kirim pesan kembali saat jam pelayanan berlangsung.
                </div>
            )}

            <div className="border border-paper-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-paper-50">
                    {pesanList.length > 0 ? pesanList.map((p) => (
                        <div key={p.id} className={`flex ${p.pengirim === 'pengadu' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                p.pengirim === 'pengadu' ? 'bg-azure-500 text-white rounded-br-sm' : 'bg-white border border-paper-200 text-navy-950 rounded-bl-sm'
                            }`}>
                                <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                                    {p.pengirim === 'pengadu' ? 'Anda' : 'Admin BPS'}
                                </div>
                                <div className="whitespace-pre-line leading-relaxed">{p.pesan}</div>
                                <div className={`text-[10px] mt-1 ${p.pengirim === 'pengadu' ? 'text-white/60' : 'text-navy-950/40'}`}>
                                    {new Date(p.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}
                                </div>
                            </div>
                        </div>
                    )) : (
                        <p className="text-center text-navy-950/30 text-sm py-6">
                            {aktif ? 'Belum ada percakapan.' : 'Menunggu admin menindaklanjuti pengaduan Anda.'}
                        </p>
                    )}
                    <div ref={bawahRef} />
                </div>

                {aktif && (
                    <form onSubmit={handleKirim} className="border-t border-paper-200 bg-white p-3 flex gap-2">
                        <input
                            value={teks}
                            onChange={(e) => setTeks(e.target.value)}
                            maxLength={2000}
                            placeholder={kirimAktif ? 'Tulis pesan...' : `Chat ditutup di luar jam pelayanan (${jamMulai}–${jamSelesai} WIB)`}
                            disabled={isPending || !kirimAktif}
                            className="flex-1 border border-paper-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 disabled:bg-paper-100 disabled:text-navy-950/30"
                        />
                        <button type="submit" disabled={isPending || !teks.trim() || !kirimAktif}
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
