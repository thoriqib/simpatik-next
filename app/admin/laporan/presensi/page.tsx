import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function LaporanPresensiPage({ searchParams }: { searchParams: Promise<{ bulan?: string; tahun?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const bulan = Number(params.bulan) || now.getMonth() + 1;
    const tahun = Number(params.tahun) || now.getFullYear();
    const start = new Date(tahun, bulan - 1, 1).toISOString().slice(0, 10);
    const end = new Date(tahun, bulan, 0).toISOString().slice(0, 10);

    const supabase = await createClient();
    const { data: jadwal } = await supabase
        .from('jadwal_piket')
        .select('*, profiles(name), presensi(kekurangan_menit)')
        .gte('tanggal', start).lte('tanggal', end);

    const rekapMap = new Map<string, { nama: string; hadir: number; izin: number; sakit: number; alpha: number; terjadwal: number; total: number; kekurangan: number }>();
    (jadwal ?? []).forEach((j) => {
        const nama = j.profiles?.name ?? '-';
        if (!rekapMap.has(nama)) rekapMap.set(nama, { nama, hadir: 0, izin: 0, sakit: 0, alpha: 0, terjadwal: 0, total: 0, kekurangan: 0 });
        const r = rekapMap.get(nama)!;
        r.total++;
        r[j.status as 'hadir' | 'izin' | 'sakit' | 'alpha' | 'terjadwal']++;
        r.kekurangan += j.presensi?.[0]?.kekurangan_menit ?? 0;
    });
    const rekap = Array.from(rekapMap.values());
    const bulanNama = new Date(tahun, bulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <>
            <h1 className="text-lg font-semibold text-gray-800 mb-4">Laporan Presensi Petugas</h1>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bulan</label>
                        <select name="bulan" defaultValue={bulan} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => <option key={b} value={b}>{new Date(2000, b - 1).toLocaleDateString('id-ID', { month: 'long' })}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tahun</label>
                        <select name="tahun" defaultValue={tahun} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            {[tahun - 1, tahun, tahun + 1].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-[#003580] text-white px-4 py-2 rounded-lg text-sm font-medium">Tampilkan</button>
                </form>
            </Card>

            <Card title={`Rekap Kehadiran Bulan ${bulanNama}`}>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-gray-500 text-left">
                            <th className="pb-3 font-medium">Petugas</th><th className="pb-3 font-medium text-center">Total</th>
                            <th className="pb-3 font-medium text-center text-green-600">Hadir</th><th className="pb-3 font-medium text-center text-blue-600">Izin</th>
                            <th className="pb-3 font-medium text-center text-orange-600">Sakit</th><th className="pb-3 font-medium text-center text-red-600">Alpha</th>
                            <th className="pb-3 font-medium text-center">% Hadir</th><th className="pb-3 font-medium text-center text-red-500">Kurang Jam</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rekap.length > 0 ? rekap.map((r) => {
                            const persen = r.total > 0 ? Math.round((r.hadir / r.total) * 100) : 0;
                            return (
                                <tr key={r.nama} className="hover:bg-gray-50">
                                    <td className="py-3 font-medium">{r.nama}</td>
                                    <td className="py-3 text-center text-gray-600">{r.total}</td>
                                    <td className="py-3 text-center font-semibold text-green-600">{r.hadir}</td>
                                    <td className="py-3 text-center text-blue-600">{r.izin}</td>
                                    <td className="py-3 text-center text-orange-600">{r.sakit}</td>
                                    <td className="py-3 text-center text-red-600">{r.alpha}</td>
                                    <td className="py-3 text-center">
                                        <div className="flex items-center gap-2">
                                            <div className="flex-1 bg-gray-100 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{ width: `${persen}%` }} /></div>
                                            <span className="text-xs text-gray-600 w-8">{persen}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3 text-center text-sm">
                                        {r.kekurangan > 0 ? <span className="text-red-500 font-semibold">{Math.floor(r.kekurangan / 60)}j {r.kekurangan % 60}m</span> : <span className="text-green-500 text-xs">✓</span>}
                                    </td>
                                </tr>
                            );
                        }) : <tr><td colSpan={8} className="py-8 text-center text-gray-400">Belum ada data presensi</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}
