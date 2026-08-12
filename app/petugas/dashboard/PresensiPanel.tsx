'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { presensiMasuk, presensiKeluar } from '@/lib/actions/presensi';
import { LogIn, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { JadwalPiket, Presensi } from '@/lib/types/database';

export function PresensiPanel({ jadwalHariIni }: { jadwalHariIni: JadwalPiket | null }) {
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; text: string } | null>(null);

    // [FIX BUG PRESENSI — akar masalahnya] Sebelumnya komponen ini HANYA
    // mengandalkan prop `jadwalHariIni` dari Server Component induk, dan
    // memaksa refetch data itu lewat router.refresh() / window.location.reload()
    // setelah presensi berhasil. Di beberapa kondisi (kemungkinan besar
    // caching Next.js/Vercel pada request fetch Supabase yang sulit
    // dipastikan tanpa akses log server), refetch itu TIDAK SELALU
    // mengembalikan data terbaru — akibatnya tombol "Presensi Masuk" tetap
    // tampil meski data sudah tersimpan di database.
    //
    // Solusi definitif: simpan hasil presensi di STATE LOKAL komponen ini,
    // diisi LANGSUNG dari nilai balik presensiMasuk()/presensiKeluar()
    // (data yang baru saja berhasil ditulis ke database, bukan hasil query
    // ulang yang berisiko basi). Tampilan dibangun dari state lokal ini
    // kalau ada, baru fallback ke prop dari server kalau belum ada aksi
    // sama sekali. Reload tetap dilakukan setelahnya (supaya bagian lain
    // halaman ikut segar), tapi TIDAK LAGI jadi satu-satunya sumber
    // kebenaran untuk update tampilan presensi itu sendiri.
    const [presensiLokal, setPresensiLokal] = useState<Partial<Presensi> | null>(null);

    const presensiAsli = jadwalHariIni?.presensi?.[0];
    // Anotasi tipe eksplisit di sini penting — tanpa ini, TypeScript bisa
    // menyimpulkan tipe gabungan yang ambigu dari spread dua tipe berbeda
    // (Presensi | undefined vs Partial<Presensi>), berisiko lolos cek
    // sintaks tapi gagal type-check saat build Vercel.
    const presensi: Partial<Presensi> | undefined = presensiLokal
        ? { ...presensiAsli, ...presensiLokal }
        : presensiAsli;

    const jamMasuk = presensi?.waktu_masuk
        ? new Date(presensi.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : null;
    const jamKeluar = presensi?.waktu_keluar
        ? new Date(presensi.waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })
        : null;

    function handleMasuk() {
        startTransition(async () => {
            const res = await presensiMasuk(jadwalHariIni!.id);
            if (res.error) {
                setMsg({ type: 'error', text: res.error });
                return;
            }
            // Update tampilan LANGSUNG dari data respons — tidak nunggu reload
            if (res.data) setPresensiLokal((prev) => ({ ...prev, ...res.data }));

            if (res.warning) setMsg({ type: 'warning', text: res.warning });
            else if (res.success) setMsg({ type: 'success', text: res.success });
            else if (res.info) setMsg({ type: 'info', text: res.info });

            setTimeout(() => window.location.reload(), 1200);
        });
    }

    function handleKeluar() {
        startTransition(async () => {
            const res = await presensiKeluar(presensi!.id!);
            if (res.error) {
                setMsg({ type: 'error', text: res.error });
                return;
            }
            if (res.data) setPresensiLokal((prev) => ({ ...prev, ...res.data }));

            if (res.warning) setMsg({ type: 'warning', text: res.warning });
            else if (res.success) setMsg({ type: 'success', text: res.success });

            setTimeout(() => window.location.reload(), 1200);
        });
    }

    const msgStyle = {
        error: 'bg-rose-50 text-rose-700 border-rose-200',
        warning: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
        success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        info: 'bg-azure-500/10 text-azure-600 border-azure-500/20',
    };

    return (
        <Card title="Presensi Hari Ini">
            {msg && (
                <div className={`mb-4 px-4 py-3 rounded-xl text-sm border ${msgStyle[msg.type]}`}>
                    {msg.text}
                </div>
            )}

            {jadwalHariIni ? (
                <>
                    <div className="flex flex-wrap items-center gap-3 mb-5 p-3.5 bg-paper-50 rounded-xl text-sm">
                        <span className="text-navy-950/60">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="text-navy-700 font-semibold">
                            Shift {jadwalHariIni.shift_piket?.nama_shift} ({jadwalHariIni.shift_piket?.jam_mulai}–{jadwalHariIni.shift_piket?.jam_selesai})
                        </span>
                        <Badge status={jadwalHariIni.status} />
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
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center gap-6 text-sm">
                                <div className="text-emerald-600">Masuk: <strong className="tabular font-mono">{jamMasuk}</strong></div>
                                <div className="text-amber-500">Keluar: <strong className="tabular font-mono">{jamKeluar}</strong></div>
                                {(presensi.kekurangan_menit ?? 0) > 0 ? (
                                    <span className="inline-flex items-center gap-1.5 text-rose-600 font-medium text-xs">
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        Kurang {Math.floor((presensi.kekurangan_menit ?? 0) / 60)}j {(presensi.kekurangan_menit ?? 0) % 60}m
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Presensi Lengkap
                                    </span>
                                )}
                            </div>

                            {((presensi.terlambat_menit ?? 0) > 0 || (presensi.pulang_awal_menit ?? 0) > 0) && (
                                <div className="flex flex-wrap gap-2 text-xs text-navy-950/50">
                                    {(presensi.terlambat_menit ?? 0) > 0 && (
                                        <span className="bg-paper-100 px-2.5 py-1 rounded-lg">⏰ Terlambat masuk: {presensi.terlambat_menit} menit</span>
                                    )}
                                    {(presensi.pulang_awal_menit ?? 0) > 0 && (
                                        <span className="bg-paper-100 px-2.5 py-1 rounded-lg">🚪 Pulang lebih awal: {presensi.pulang_awal_menit} menit</span>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="py-6 text-center text-navy-950/30 text-sm">Tidak ada jadwal piket untuk Anda hari ini.</div>
            )}
        </Card>
    );
}
