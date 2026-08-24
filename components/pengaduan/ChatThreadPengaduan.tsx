'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { kirimPesanAdminPengaduan, selesaikanPengaduan } from '@/lib/actions/pengaduan';
import { cekDalamJamPelayananClient } from '@/lib/jam-pelayanan-client';
import { ConfirmModal } from '@/components/ui/Modal';
import { Send, CheckCheck, RefreshCw, Circle, Clock } from 'lucide-react';
import type { PengaduanPesan } from '@/lib/types/database';

/**
 * Chat thread untuk sisi admin menangani pengaduan. Komponen TERPISAH
 * dari ChatThread (permintaan data) — meski polanya identik, dijaga
 * terpisah supaya perubahan di satu fitur tidak berisiko mematahkan
 * fitur lain yang sudah berjalan baik.
 *
 * [REALTIME] Postgres Changes — sama seperti ChatThread permintaan
 * data, termasuk fix `realtime.setAuth()` di awal supaya koneksi
 * benar-benar terautentikasi (bukan diam-diam dianggap anon oleh RLS).
 *
 * [JAM PELAYANAN] Chat cuma bisa dipakai pada jam pelayanan — dicek
 * ulang tiap 30 detik di client, dan divalidasi lagi di server action
 * (pertahanan sesungguhnya).
 */
export function ChatThreadPengaduan({
    pengaduanId,
    pesanAwal,
    status,
    jamMulai,
    jamSelesai,
}: {
    pengaduanId: number;
    pesanAwal: PengaduanPesan[];
    status: string;
    jamMulai: string;
    jamSelesai: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [pesanList, setPesanList] = useState<PengaduanPesan[]>(pesanAwal);
    const [teks, setTeks] = useState('');
    const [error, setError] = useState('');
    const [confirmSelesai, setConfirmSelesai] = useState(false);
    const [live, setLive] = useState(false);
    const [dalamJamPelayanan, setDalamJamPelayanan] = useState(true);
    const bawahRef = useRef<HTMLDivElement>(null);

    const bisaKirim = status !== 'selesai';
    const bisaSelesaikan = status !== 'selesai';

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
        let channel: ReturnType<typeof supabase.channel> | null = null;

        (async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                supabase.realtime.setAuth(session.access_token);
            }

            channel = supabase
                .channel(`pengaduan-pesan-${pengaduanId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'pengaduan_pesan', filter: `pengaduan_id=eq.${pengaduanId}` },
                    (payload) => {
                        const pesanBaru = payload.new as PengaduanPesan;
                        setPesanList((prev) => (prev.some((p) => p.id === pesanBaru.id) ? prev : [...prev, pesanBaru]));
                    }
                )
                .subscribe((s) => setLive(s === 'SUBSCRIBED'));
        })();

        const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.access_token) supabase.realtime.setAuth(session.access_token);
        });

        return () => {
            if (channel) supabase.removeChannel(channel);
            authListener.subscription.unsubscribe();
        };
    }, [pengaduanId]);

    function handleKirim(e: React.FormEvent) {
        e.preventDefault();
        const teksKirim = teks.trim();
        if (!teksKirim) return;
        setError('');

        startTransition(async () => {
            const res = await kirimPesanAdminPengaduan(pengaduanId, teksKirim);
            if (res?.error) {
                setError(res.error);
                return;
            }
            setTeks('');
        });
    }

    function handleSelesaikan() {
        startTransition(async () => {
            const res = await selesaikanPengaduan(pengaduanId);
            setConfirmSelesai(false);
            if (res?.error) {
                setError(res.error);
                return;
            }
            window.location.reload();
        });
    }

    const kirimAktif = bisaKirim && dalamJamPelayanan;

    return (
        <div>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}

            {status !== 'baru' && (
                <div className="flex items-center gap-1.5 mb-2 text-xs">
                    <Circle className={`w-2 h-2 ${live ? 'fill-emerald-500 text-emerald-500' : 'fill-navy-950/20 text-navy-950/20'}`} />
                    <span className={live ? 'text-emerald-600 font-medium' : 'text-navy-950/40'}>{live ? 'Live — pesan baru muncul otomatis' : 'Menghubungkan...'}</span>
                </div>
            )}

            {bisaKirim && !dalamJamPelayanan && (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3.5 py-2.5 text-xs mb-3">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    Percakapan hanya aktif pada jam pelayanan ({jamMulai}–{jamSelesai} WIB).
                </div>
            )}

            {status === 'baru' && (
                <div className="bg-azure-500/10 border border-blue-200 text-navy-700 rounded-xl px-3.5 py-2.5 text-xs mb-3">
                    Kirim balasan pertama untuk membuka percakapan dengan pengadu.
                </div>
            )}

            <div className="border border-paper-200 rounded-xl overflow-hidden">
                <div className="max-h-96 overflow-y-auto p-4 space-y-3 bg-paper-50">
                    {pesanList.length > 0 ? pesanList.map((p) => (
                        <div key={p.id} className={`flex ${p.pengirim === 'petugas' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
                                p.pengirim === 'petugas' ? 'bg-navy-700 text-white rounded-br-sm' : 'bg-white border border-paper-200 text-navy-950 rounded-bl-sm'
                            }`}>
                                <div className="text-[10px] uppercase tracking-wide opacity-60 mb-0.5">
                                    {p.pengirim === 'petugas' ? 'Anda/Admin' : 'Pengadu (Anonim)'}
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
                            placeholder={kirimAktif ? 'Tulis balasan...' : `Chat ditutup di luar jam pelayanan (${jamMulai}–${jamSelesai} WIB)`}
                            disabled={isPending || !kirimAktif}
                            className="flex-1 border border-paper-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 disabled:bg-paper-100 disabled:text-navy-950/30"
                        />
                        <button type="submit" disabled={isPending || !teks.trim() || !kirimAktif}
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

                {bisaSelesaikan && pesanList.length > 0 && (
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
                message="Percakapan akan ditutup — pengadu tidak bisa mengirim pesan lagi setelah ini. Riwayat chat tetap tersimpan sebagai catatan tanggapan."
                confirmText="Ya, Tandai Selesai"
                pendingText="Memproses..."
                variant="primary"
            />
        </div>
    );
}
