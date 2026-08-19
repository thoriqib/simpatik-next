import { createClient } from '@/lib/supabase/server';
import { getMondayOfWeek, getWeekdayDates, currentWeekMondayWIB, toDateStringLocal, parseDateLocal } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import type { JadwalPublik, ShiftPiket, HariLibur } from '@/lib/types/database';

const STATUS_DOT: Record<string, string> = {
    hadir: 'bg-green-500', izin: 'bg-blue-400', sakit: 'bg-orange-400',
    alpha: 'bg-red-400', terjadwal: 'bg-navy-700',
};
const STATUS_TEXT: Record<string, string> = {
    hadir: 'text-green-600', izin: 'text-blue-500', sakit: 'text-orange-500', alpha: 'text-red-500',
};

/**
 * Tampilan jadwal petugas mingguan (Senin–Jumat), dipakai bersama oleh:
 * - Halaman publik /jadwal-petugas (kalau nanti dibutuhkan lagi)
 * - Halaman admin /admin/jadwal-petugas
 *
 * `basePath` menentukan ke mana link navigasi minggu mengarah, supaya
 * komponen yang sama bisa dipakai di dua konteks route berbeda tanpa
 * duplikasi ~150 baris kode.
 */
export async function JadwalPetugasView({ minggu, basePath }: { minggu?: string; basePath: string }) {
    // ── Tentukan Senin minggu yang ditampilkan (default: minggu ini WIB) ──
    const monday = minggu ? getMondayOfWeek(parseDateLocal(minggu)) : currentWeekMondayWIB();
    const hariKerja = getWeekdayDates(monday); // Senin–Jumat, 5 hari

    const startStr = toDateStringLocal(hariKerja[0]);
    const endStr = toDateStringLocal(hariKerja[4]);

    // Minggu sebelumnya/berikutnya untuk navigasi
    const mondayPrev = new Date(monday); mondayPrev.setDate(mondayPrev.getDate() - 7);
    const mondayNext = new Date(monday); mondayNext.setDate(mondayNext.getDate() + 7);
    const mondayThisWeek = currentWeekMondayWIB();
    const isMingguIni = toDateStringLocal(monday) === toDateStringLocal(mondayThisWeek);

    const supabase = await createClient();
    const { data: jadwal } = await supabase
        .from('v_jadwal_publik')
        .select('*')
        .gte('tanggal', startStr)
        .lte('tanggal', endStr)
        .order('tanggal');

    const { data: shifts } = await supabase.from('shift_piket').select('*').eq('is_aktif', true).order('jam_mulai');

    const { data: hariLibur } = await supabase
        .from('hari_libur')
        .select('*')
        .gte('tanggal', startStr)
        .lte('tanggal', endStr);

    const liburByTanggal = new Map<string, HariLibur>();
    (hariLibur ?? []).forEach((h) => liburByTanggal.set(h.tanggal, h));

    const jadwalByTanggal = new Map<string, JadwalPublik[]>();
    (jadwal ?? []).forEach((j) => {
        if (!jadwalByTanggal.has(j.tanggal)) jadwalByTanggal.set(j.tanggal, []);
        jadwalByTanggal.get(j.tanggal)!.push(j);
    });

    const rangeLabel = `${hariKerja[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} – ${hariKerja[4].toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    const todayStr = toDateStringLocal(new Date());

    return (
        <>
            <div className="mb-5">
                <h2 className="text-xl font-bold text-navy-950">Jadwal Petugas Pelayanan</h2>
                <p className="text-sm text-navy-950/50 mt-1">Jadwal piket petugas Simpatik, {rangeLabel}</p>
            </div>

            {/* Navigasi minggu */}
            <div className="bg-white rounded-xl border border-paper-200 shadow-sm p-3 mb-5 flex items-center justify-between gap-3">
                <Link
                    href={`${basePath}?minggu=${toDateStringLocal(mondayPrev)}`}
                    className="inline-flex items-center gap-1.5 text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-50 transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Minggu Lalu
                </Link>

                <div className="flex items-center gap-3">
                    <span className="font-semibold text-navy-950 text-sm text-center">{rangeLabel}</span>
                    {!isMingguIni && (
                        <Link
                            href={basePath}
                            className="inline-flex items-center gap-1.5 text-xs bg-azure-500/10 text-azure-500 px-3 py-1.5 rounded-lg font-medium hover:bg-azure-500/20 transition-colors"
                        >
                            <CalendarClock className="w-3.5 h-3.5" /> Minggu Ini
                        </Link>
                    )}
                </div>

                <Link
                    href={`${basePath}?minggu=${toDateStringLocal(mondayNext)}`}
                    className="inline-flex items-center gap-1.5 text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-50 transition-colors"
                >
                    Minggu Depan <ChevronRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="bg-white rounded-xl border border-paper-200 shadow-sm overflow-hidden">
                <div className="grid border-b border-gray-200 bg-navy-700 text-white text-sm font-semibold"
                    style={{ gridTemplateColumns: `140px repeat(${shifts?.length ?? 1}, 1fr)` }}>
                    <div className="px-4 py-3">Tanggal</div>
                    {shifts?.map((shift) => (
                        <div key={shift.id} className="px-4 py-3 border-l border-blue-700">
                            <div>{shift.nama_shift}</div>
                            <div className="text-blue-200 text-xs font-normal">{shift.jam_mulai}–{shift.jam_selesai}</div>
                        </div>
                    ))}
                </div>
                {hariKerja.map((tgl) => {
                    const tglStr = toDateStringLocal(tgl);
                    const jadwalHari = jadwalByTanggal.get(tglStr) ?? [];
                    const libur = liburByTanggal.get(tglStr);
                    const isToday = tglStr === todayStr;

                    return (
                        <div key={tglStr} className="border-b border-paper-200 last:border-0">
                            <div
                                className={`grid text-sm ${isToday ? 'bg-azure-500/10' : 'hover:bg-paper-50'} transition`}
                                style={{ gridTemplateColumns: `140px repeat(${shifts?.length ?? 1}, 1fr)` }}
                            >
                                <div className="px-4 py-4 border-r border-paper-200">
                                    <div className={`font-semibold ${isToday ? 'text-navy-700' : 'text-navy-950/80'}`}>
                                        {tgl.toLocaleDateString('id-ID', { weekday: 'short' })}
                                        {isToday && <span className="ml-1 text-xs bg-navy-700 text-white px-1.5 py-0.5 rounded">Hari ini</span>}
                                    </div>
                                    <div className="text-navy-950/50 text-xs mt-0.5">{tgl.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}</div>
                                </div>
                                {shifts?.map((shift: ShiftPiket) => {
                                    const petugasShift = jadwalHari.filter((j) => j.shift_id === shift.id);
                                    return (
                                        <div key={shift.id} className="px-4 py-4 border-r border-paper-200 last:border-0">
                                            {libur ? (
                                                <span className="text-rose-400 text-xs italic">Libur</span>
                                            ) : petugasShift.length === 0 ? (
                                                <span className="text-navy-950/20 text-xs italic">—</span>
                                            ) : (
                                                <div className="space-y-1.5">
                                                    {petugasShift.map((j) => (
                                                        <div key={j.id} className="flex items-center gap-2">
                                                            <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold ${STATUS_DOT[j.status]}`}>
                                                                {j.nama_petugas.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div>
                                                                <div className="text-xs font-medium text-navy-950 leading-tight">{j.nama_petugas}</div>
                                                                {j.status !== 'terjadwal' && (
                                                                    <div className={`text-xs leading-tight ${STATUS_TEXT[j.status]}`}>
                                                                        {j.status.charAt(0).toUpperCase() + j.status.slice(1)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Banner hari libur — merentang penuh di bawah baris tanggal */}
                            {libur && (
                                <div className="px-4 py-2 bg-rose-50 border-t border-rose-100 text-rose-600 text-xs font-medium flex items-center gap-1.5">
                                    🎌 Hari Libur Nasional: {libur.keterangan}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap gap-4 text-xs text-navy-950/50">
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-navy-700 inline-block" /> Terjadwal</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-green-500 inline-block" /> Hadir</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-blue-400 inline-block" /> Izin</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-orange-400 inline-block" /> Sakit</span>
                <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-red-400 inline-block" /> Alpha</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400 inline-block" /> Libur Nasional</span>
            </div>
        </>
    );
}
