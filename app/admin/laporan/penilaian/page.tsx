import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function LaporanPenilaianPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const dari = params.dari || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const sampai = params.sampai || now.toISOString().slice(0, 10);

    const supabase = await createClient();

    const { data: petugasList } = await supabase.from('profiles').select('id, name').eq('role', 'petugas');
    const { data: penilaian } = await supabase
        .from('penilaian')
        .select('nilai, komentar, petugas_id, profiles(name), antrian!inner(tanggal, jenis_layanan(nama_layanan))')
        .gte('antrian.tanggal', dari)
        .lte('antrian.tanggal', sampai);

    const rankingMap = new Map<string, { nama: string; total: number; jumlah: number }>();
    (petugasList ?? []).forEach((p) => rankingMap.set(p.id, { nama: p.name, total: 0, jumlah: 0 }));
    (penilaian ?? []).forEach((p) => {
        const entry = rankingMap.get(p.petugas_id);
        if (entry) { entry.total += p.nilai; entry.jumlah += 1; }
    });
    const ranking = Array.from(rankingMap.values())
        .filter((r) => r.jumlah > 0)
        .map((r) => ({ ...r, avg: r.total / r.jumlah }))
        .sort((a, b) => b.avg - a.avg);

    const distribusi: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    (penilaian ?? []).forEach((p) => { distribusi[p.nilai] = (distribusi[p.nilai] ?? 0) + 1; });
    const totalNilai = Object.values(distribusi).reduce((a, b) => a + b, 0);

    const komentarList = (penilaian ?? []).filter((p) => p.komentar).slice(0, 10);

    return (
        <>
            <h1 className="text-lg font-semibold text-gray-800 mb-4">Laporan Penilaian Petugas</h1>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Dari</label><input type="date" name="dari" defaultValue={dari} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Sampai</label><input type="date" name="sampai" defaultValue={sampai} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                    <button type="submit" className="bg-[#003580] text-white px-4 py-2 rounded-lg text-sm font-medium">Tampilkan</button>
                </form>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card title="Ranking Nilai Petugas">
                    {ranking.length > 0 ? ranking.map((r, i) => (
                        <div key={r.nama} className="flex items-center gap-4 py-3 border-b border-gray-100 last:border-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${i === 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-50 text-gray-400'}`}>{i + 1}</div>
                            <div className="flex-1"><div className="font-medium text-sm">{r.nama}</div><div className="text-xs text-gray-400">{r.jumlah} penilaian</div></div>
                            <div className="font-bold text-yellow-500">★ {r.avg.toFixed(1)}</div>
                        </div>
                    )) : <p className="text-gray-400 text-sm py-4 text-center">Belum ada data penilaian</p>}
                </Card>

                <Card title="Distribusi Nilai">
                    {[5, 4, 3, 2, 1].map((bintang) => (
                        <div key={bintang} className="flex items-center gap-3 mb-3">
                            <div className="w-16 text-sm text-right text-gray-600 flex-shrink-0">{bintang} ★</div>
                            <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div className="bg-yellow-400 h-3 rounded-full" style={{ width: `${totalNilai > 0 ? (distribusi[bintang] / totalNilai) * 100 : 0}%` }} />
                            </div>
                            <div className="w-10 text-xs text-gray-500 text-right flex-shrink-0">{distribusi[bintang]}</div>
                        </div>
                    ))}
                </Card>
            </div>

            <Card title="Komentar Terbaru" className="mt-5">
                {komentarList.length > 0 ? komentarList.map((k, i) => (
                    <div key={i} className="py-3 border-b border-gray-100 last:border-0">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                                <div className="text-sm text-gray-800">{k.komentar}</div>
                                <div className="text-xs text-gray-400 mt-1">Untuk: <strong>{k.profiles?.name}</strong> · {k.antrian.jenis_layanan?.nama_layanan}</div>
                            </div>
                            <div className="text-yellow-500 font-bold flex-shrink-0">{'★'.repeat(k.nilai)}{'☆'.repeat(5 - k.nilai)}</div>
                        </div>
                    </div>
                )) : <p className="text-gray-400 text-sm py-4 text-center">Belum ada komentar</p>}
            </Card>
        </>
    );
}
