'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { presensiMasuk, presensiKeluar } from '@/lib/actions/presensi';
import { todayDateStringWIB } from '@/lib/utils';
import { LogIn, LogOut, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import type { Presensi } from '@/lib/types/database';

/**
 * [RANCANG ULANG TOTAL] Komponen ini sekarang mengambil status presensi
 * LANGSUNG dari browser ke Supabase (bukan lewat Server Component Next.js)
 * — sepenuhnya melewati semua lapisan cache Next.js/Vercel yang selama
 * ini jadi sumber bug berulang (tampilan sempat benar, lalu kembali salah
 * setelah reload/pindah halaman). Query browser→Supabase ini tidak
 * pernah melewati proses render server Next.js sama sekali, jadi tidak
 * ada cache apa pun yang bisa membuatnya basi.
 *
 * Penulisan (presensi masuk/keluar) TETAP lewat Server Action — jam
 * dihitung & divalidasi di server (bukan dari jam browser pengguna yang
 * bisa saja salah/dimanipulasi), menjaga integritas data presensi.
 */

interface ShiftInfo {
    nama_shift: string;
    jam_mulai: string;
    jam_selesai: string;
}

type MsgType = { type: 'success' | 'warning' | 'error' | 'info'; text: string };

export function PresensiPanel({
    jadwalPiketId,
    shiftInfo,
    userId,
}: {
    jadwalPiketId: number | null;
    shiftInfo: ShiftInfo | null;
    userId: string;
}) {
    const [isPending, startTransition] = useTransition();
    const [loading, setLoading] = useState(true);
    const [presensi, setPresensi] = useState<Partial<Presensi> | null>(null);
    const [jumlahDilayani, setJumlahDilayani] = useState<number | null>(null);
    const [msg, setMsg] = useState<MsgType | null>(null);

    // ── Ambil status presensi LANGSUNG dari Supabase saat komponen dimuat ──
    // Ini yang menjamin data selalu segar setiap kali halaman dibuka/di-reload/
    // dikunjungi ulang — tidak bergantung pada apa pun yang dirender server.
    useEffect(() => {
        if (!jadwalPiketId) {
            setLoading(false);
            return;
        }
        let batal = false;
        (async () => {
            const supabase = createClient();
            const { data } = await supabase
                .from('presensi')
                .select('*')
                .eq('jadwal_piket_id', jadwalPiketId)
                .maybeSingle();
            if (!batal) {
                setPresensi(data ?? null);
                setLoading(false);
            }
        })();
        return () => { batal = true; };
    }, [jadwalPiketId]);

    // ── Ambil jumlah pengunjung yang dilayani hari ini — cuma perlu kalau
    // presensi sudah lengkap (jam keluar terisi), untuk rekap akhir. ──
    useEffect(() => {
        if (!presensi?.waktu_keluar) return;
        (async () => {
            const supabase = createClient();
            const today = todayDateStringWIB();
            const { count } = await supabase
                .from('antrian')
                .select('*', { count: 'exact', head: true })
                .eq('petugas_id', userId)
                .eq('tanggal', today)
                .eq('status', 'selesai');
            setJumlahDilayani(count ?? 0);
        })();
    }, [presensi?.waktu_keluar, userId]);

    const jamMasuk = presensi?.waktu_masuk
        ? new Date(presensi.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : null;
    const jamKeluar = presensi?.waktu_keluar
        ? new Date(presensi.waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : null;

    function handleMasuk() {
        if (!jadwalPiketId) return;
        setMsg(null);
        startTransition(async () => {
            const res = await presensiMasuk(jadwalPiketId);
            if (res.error) {
                setMsg({ type: 'error', text: res.error });
                return;
            }
            // Update tampilan langsung dari data respons server — instan,
            // tidak perlu nunggu refetch apa pun.
            if (res.data) setPresensi((prev) => ({ ...prev, ...res.data }));

            if (res.warning) setMsg({ type: 'warning', text: res.warning });
            else if (res.success) setMsg({ type: 'success', text: res.success });
            else if (res.info) setMsg({ type: 'info', text: res.info });
        });
    }

    function handleKeluar() {
        if (!presensi?.id) return;
        setMsg(null);
        startTransition(async () => {
            const res = await presensiKeluar(presensi.id!);
            if (res.error) {
                setMsg({ type: 'error', text: res.error });
                return;
            }
            if (res.data) setPresensi((prev) => ({ ...prev, ...res.data }));

            if (res.warning) setMsg({ type: 'warning', text: res.warning });
            else if (res.success) setMsg({ type: 'success', text: res.success });
        });
    }

    const msgStyle: Record<MsgType['type'], string> = {
        error: 'bg-rose-50 text-rose-700 border-rose-200',
        warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        info: 'bg-azure-500/10 text-azure-600 border-azure-500/20',
    };

    if (!jadwalPiketId) {
        return (
            <Card title="Presensi Hari Ini">
                <div className="py-6 text-center text-navy-950/30 text-sm">Tidak ada jadwal piket untuk Anda hari ini.</div>
            </Card>
        );
    }

    if (loading) {
        return (
            <Card title="Presensi Hari Ini">
                <div className="animate-pulse space-y-3">
                    <div className="h-14 bg-paper-100 rounded-xl" />
                    <div className="h-10 bg-paper-100 rounded-xl w-48 mx-auto" />
                </div>
            </Card>
        );
    }

    return (
        <Card title="Presensi Hari Ini">
            {msg && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${msgStyle[msg.type]}`}>
                    {msg.text}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-3 mb-5 p-3.5 bg-paper-50 rounded-xl text-sm">
                <span className="text-navy-950/60">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                {shiftInfo && (
                    <span className="text-navy-700 font-semibold">
                        Shift {shiftInfo.nama_shift} ({shiftInfo.jam_mulai}–{shiftInfo.jam_selesai})
                    </span>
                )}
                <Badge status={presensi?.waktu_masuk ? 'hadir' : 'terjadwal'} />
            </div>

            {!presensi?.waktu_masuk ? (
                <div className="text-center py-4">
                    <p className="text-navy-950/50 text-sm mb-4">Anda belum melakukan presensi masuk hari ini.</p>
                    <button onClick={handleMasuk} disabled={isPending}
                        className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors text-sm disabled:opacity-50">
                        <LogIn className="w-4 h-4" />
                        {isPending ? 'Memproses...' : 'Presensi Masuk'}
                    </button>
                </div>
            ) : !presensi.waktu_keluar ? (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-700">Sudah Masuk</span>
                            <span className="text-navy-950/50">— Pukul {jamMasuk} WIB</span>
                        </div>
                        <button onClick={handleKeluar} disabled={isPending}
                            className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-amber-500/90 transition-colors text-sm disabled:opacity-50">
                            <LogOut className="w-4 h-4" />
                            {isPending ? 'Memproses...' : 'Presensi Keluar'}
                        </button>
                    </div>

                    {(presensi.terlambat_menit ?? 0) > 0 && (
                        <div className="inline-flex items-center gap-1.5 text-amber-600 text-xs font-medium bg-amber-500/10 px-3 py-1.5 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Terlambat {presensi.terlambat_menit} menit dari jadwal masuk
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-sm font-semibold text-emerald-700">Anda sudah melakukan presensi untuk hari ini.</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                        <div className="bg-paper-50 rounded-xl p-3">
                            <div className="text-[10px] text-navy-950/40 uppercase tracking-wide mb-1">Jam Masuk</div>
                            <div className="font-mono text-lg font-semibold text-emerald-600 tabular">{jamMasuk}</div>
                        </div>
                        <div className="bg-paper-50 rounded-xl p-3">
                            <div className="text-[10px] text-navy-950/40 uppercase tracking-wide mb-1">Jam Keluar</div>
                            <div className="font-mono text-lg font-semibold text-amber-600 tabular">{jamKeluar}</div>
                        </div>
                        <div className="bg-paper-50 rounded-xl p-3">
                            <div className="text-[10px] text-navy-950/40 uppercase tracking-wide mb-1 flex items-center gap-1"><Users className="w-3 h-3" /> Dilayani</div>
                            <div className="font-mono text-lg font-semibold text-navy-700 tabular">{jumlahDilayani ?? '…'}</div>
                        </div>
                        <div className="bg-paper-50 rounded-xl p-3">
                            <div className="text-[10px] text-navy-950/40 uppercase tracking-wide mb-1">Waktu Terlambat</div>
                            <div className="font-mono text-lg font-semibold text-navy-950 tabular">{presensi.terlambat_menit ?? 0}m</div>
                        </div>
                        <div className="bg-paper-50 rounded-xl p-3">
                            <div className="text-[10px] text-navy-950/40 uppercase tracking-wide mb-1">Sisa Waktu Pelayanan</div>
                            <div className="font-mono text-lg font-semibold text-navy-950 tabular">{presensi.pulang_awal_menit ?? 0}m</div>
                        </div>
                        <div className="bg-paper-50 rounded-xl p-3">
                            <div className="text-[10px] text-navy-950/40 uppercase tracking-wide mb-1">Kekurangan Jam</div>
                            <div className={`font-mono text-lg font-semibold tabular ${(presensi.kekurangan_menit ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {presensi.kekurangan_menit ?? 0}m
                            </div>
                        </div>
                    </div>

                    {(presensi.kekurangan_menit ?? 0) === 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Presensi Lengkap, Tidak Ada Kekurangan
                        </span>
                    )}
                </div>
            )}
        </Card>
    );
}
