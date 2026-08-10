import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';
import { PresensiPanel } from '../dashboard/PresensiPanel';
import type { JadwalPiket } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function PresensiPetugasPage({ searchParams }: { searchParams: Promise<{ bulan?: string; tahun?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const bulan = Number(params.bulan) || now.getMonth() + 1;
    const tahun = Number(params.tahun) || now.getFullYear();
    const start = new Date(tahun, bulan - 1, 1).toISOString().slice(0, 10);
    const end = new Date(tahun, bulan, 0).toISOString().slice(0, 10);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const today = todayDateStringWIB();

    // [FIX] Cast eksplisit — relasi to-one `shift_piket` ditebak sebagai
    // array tanpa generated types.
    const { data: jadwalHariIniRaw } = await supabase
        .from('jadwal_piket')
        .select('*, shift_piket(*), presensi(*)')
        .eq('user_id', user!.id)
        .eq('tanggal', today)
        .maybeSingle();

    const jadwalHariIni = jadwalHariIniRaw as unknown as JadwalPiket | null;

    const { data: jadwalBulanRaw } = await supabase
        .from('jadwal_piket')
        .select('*, shift_piket(*), presensi(*)')
        .eq('user_id', user!.id)
        .gte('tanggal', start).lte('tanggal', end)
        .order('tanggal');

    const jadwalBulan = jadwalBulanRaw as unknown as JadwalPiket[] | null;

    const rekap = { hadir: 0, izin: 0, sakit: 0, alpha: 0, terjadwal: 0, totalKekurangan: 0 };
    (jadwalBulan ?? []).forEach((j) => {
        rekap[j.status as 'hadir' | 'izin' | 'sakit' | 'alpha' | 'terjadwal']++;
        rekap.totalKekurangan += j.presensi?.[0]?.kekurangan_menit ?? 0;
    });

    const bulanNama = new Date(tahun, bulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    const todayStr = new Date().toISOString().slice(0, 10);

    function jamWIB(iso: string | null) {
        return iso ? new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : null;
    }

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-4">Presensi Saya</h1>

            <PresensiPanel jadwalHariIni={jadwalHariIni ?? null} />

            <div className="mt-5">
                <Card title="Riwayat Presensi Bulan Ini">
                    <form method="GET" className="flex flex-wrap gap-3 items-end mb-5">
                        <div>
                            <label className="block text-xs text-navy-950/50 mb-1">Bulan</label>
                            <select name="bulan" defaultValue={bulan} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                                {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => <option key={b} value={b}>{new Date(2000, b - 1).toLocaleDateString('id-ID', { month: 'long' })}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-navy-950/50 mb-1">Tahun</label>
                            <select name="tahun" defaultValue={tahun} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                                {[tahun - 1, tahun].map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Tampilkan</button>
                    </form>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-green-50 rounded-xl p-3 text-center"><div className="text-xl font-bold text-green-700">{rekap.hadir}</div><div className="text-xs text-green-600">Hadir</div></div>
                        <div className="bg-azure-500/10 rounded-xl p-3 text-center"><div className="text-xl font-bold text-navy-700">{rekap.izin + rekap.sakit}</div><div className="text-xs text-azure-500">Izin/Sakit</div></div>
                        <div className="bg-red-50 rounded-xl p-3 text-center"><div className="text-xl font-bold text-red-700">{rekap.alpha}</div><div className="text-xs text-red-600">Alpha</div></div>
                    </div>

                    <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-navy-950/50 text-left">
                                <th className="pb-3 font-medium">Tanggal</th><th className="pb-3 font-medium">Shift</th><th className="pb-3 font-medium">Status</th>
                                <th className="pb-3 font-medium">Masuk</th><th className="pb-3 font-medium">Keluar</th><th className="pb-3 font-medium">Durasi</th>
                                <th className="pb-3 font-medium text-red-500">Kurang Jam</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {jadwalBulan && jadwalBulan.length > 0 ? jadwalBulan.map((item) => {
                                const p = item.presensi?.[0];
                                const isToday = item.tanggal === todayStr;
                                const durasiMenit = p?.waktu_masuk && p?.waktu_keluar
                                    ? Math.round((new Date(p.waktu_keluar).getTime() - new Date(p.waktu_masuk).getTime()) / 60000) : null;
                                return (
                                    <tr key={item.id} className={`hover:bg-paper-50 ${isToday ? 'bg-azure-500/10 font-medium' : ''} ${(p?.kekurangan_menit ?? 0) > 0 ? 'bg-red-50' : ''}`}>
                                        <td className="py-3">
                                            {new Date(item.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            {isToday && <span className="text-xs text-azure-500 ml-1">(hari ini)</span>}
                                        </td>
                                        <td className="py-3 text-navy-950/60">{item.shift_piket?.nama_shift}</td>
                                        <td className="py-3"><Badge status={item.status} /></td>
                                        <td className="py-3 font-mono text-sm">
                                            {jamWIB(p?.waktu_masuk ?? null) ?? '—'}
                                            {p && p.terlambat_menit > 0 && <span className="text-amber-600 text-xs ml-1">(+{p.terlambat_menit}m)</span>}
                                        </td>
                                        <td className="py-3 font-mono text-sm">
                                            {jamWIB(p?.waktu_keluar ?? null) ?? '—'}
                                            {p && p.pulang_awal_menit > 0 && <span className="text-rose-600 text-xs ml-1">(-{p.pulang_awal_menit}m)</span>}
                                        </td>
                                        <td className="py-3 text-navy-950/50 text-xs">{durasiMenit !== null ? `${Math.floor(durasiMenit / 60)}j ${durasiMenit % 60}m` : '—'}</td>
                                        <td className="py-3 text-sm font-semibold">
                                            {(p?.kekurangan_menit ?? 0) > 0
                                                ? <span className="text-red-500">⚠ {Math.floor(p!.kekurangan_menit / 60)}j {p!.kekurangan_menit % 60}m</span>
                                                : p?.waktu_keluar ? <span className="text-green-500 text-xs">✓ Lengkap</span> : <span className="text-navy-950/20">—</span>}
                                        </td>
                                    </tr>
                                );
                            }) : <tr><td colSpan={7} className="py-8 text-center text-navy-950/30">Tidak ada jadwal di bulan ini</td></tr>}
                        </tbody>
                    </table>
                    </div>

                    {rekap.totalKekurangan > 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            Total kekurangan jam bulan ini: <strong>{Math.floor(rekap.totalKekurangan / 60)}j {rekap.totalKekurangan % 60}m</strong>
                        </div>
                    )}
                </Card>
            </div>
        </>
    );
}
