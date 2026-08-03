'use client';

import { useState, useTransition } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { presensiMasuk, presensiKeluar } from '@/lib/actions/presensi';
import type { JadwalPiket } from '@/lib/types/database';

export function PresensiPanel({ jadwalHariIni }: { jadwalHariIni: JadwalPiket | null }) {
    const [isPending, startTransition] = useTransition();
    const [msg, setMsg] = useState<{ type: 'success' | 'warning' | 'error' | 'info'; text: string } | null>(null);

    const presensi = jadwalHariIni?.presensi?.[0];

    function handleMasuk() {
        startTransition(async () => {
            const res = await presensiMasuk(jadwalHariIni!.id);
            if (res.error) setMsg({ type: 'error', text: res.error });
            else if (res.warning) setMsg({ type: 'warning', text: res.warning });
            else if (res.success) setMsg({ type: 'success', text: res.success });
            else if (res.info) setMsg({ type: 'info', text: res.info });
            window.location.reload();
        });
    }

    function handleKeluar() {
        startTransition(async () => {
            const res = await presensiKeluar(presensi!.id);
            if (res.error) setMsg({ type: 'error', text: res.error });
            else if (res.warning) setMsg({ type: 'warning', text: res.warning });
            else if (res.success) setMsg({ type: 'success', text: res.success });
            window.location.reload();
        });
    }

    return (
        <Card title="Presensi Hari Ini">
            {msg && (
                <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${
                    msg.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    msg.type === 'warning' ? 'bg-yellow-50 text-yellow-800 border border-yellow-200' :
                    'bg-green-50 text-green-700 border border-green-200'}`}>
                    {msg.text}
                </div>
            )}

            {jadwalHariIni ? (
                <>
                    <div className="flex flex-wrap items-center gap-3 mb-5 p-3 bg-blue-50 rounded-lg text-sm">
                        <span>{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="text-blue-600 font-semibold">
                            Shift {jadwalHariIni.shift_piket?.nama_shift} ({jadwalHariIni.shift_piket?.jam_mulai}–{jadwalHariIni.shift_piket?.jam_selesai})
                        </span>
                        <Badge status={jadwalHariIni.status} />
                    </div>

                    {!presensi?.waktu_masuk ? (
                        <div className="text-center py-4">
                            <p className="text-gray-500 text-sm mb-4">Anda belum melakukan presensi masuk hari ini.</p>
                            <button onClick={handleMasuk} disabled={isPending}
                                className="inline-flex items-center gap-2 bg-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-green-700 transition text-sm disabled:opacity-50">
                                ✅ {isPending ? 'Memproses...' : 'Presensi Masuk'}
                            </button>
                        </div>
                    ) : !presensi?.waktu_keluar ? (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="text-sm">
                                <span className="font-semibold text-green-700">Sudah Masuk</span> — Pukul {new Date(presensi.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                            </div>
                            <button onClick={handleKeluar} disabled={isPending}
                                className="inline-flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-orange-600 transition text-sm disabled:opacity-50">
                                🔚 {isPending ? 'Memproses...' : 'Presensi Keluar'}
                            </button>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <div className="text-green-600">Masuk: <strong>{new Date(presensi.waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}</strong></div>
                            <div className="text-orange-500">Keluar: <strong>{new Date(presensi.waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })}</strong></div>
                            {presensi.kekurangan_menit > 0 ? (
                                <span className="text-red-500 font-semibold">⚠ Kurang {Math.floor(presensi.kekurangan_menit / 60)}j {presensi.kekurangan_menit % 60}m</span>
                            ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">✅ Presensi Lengkap</span>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <div className="py-6 text-center text-gray-400 text-sm">Tidak ada jadwal piket untuk Anda hari ini.</div>
            )}
        </Card>
    );
}
