import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { hapusPenilaian } from '@/lib/actions/penilaian';

export const dynamic = 'force-dynamic';

export default async function PenilaianAdminPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string; nilai?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const dari = params.dari || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const sampai = params.sampai || now.toISOString().slice(0, 10);

    const supabase = await createClient();
    let query = supabase
        .from('penilaian')
        .select('*, profiles(name), antrian!inner(tanggal, jenis_layanan(nama_layanan))')
        .gte('antrian.tanggal', dari)
        .lte('antrian.tanggal', sampai)
        .order('created_at', { ascending: false });

    if (params.nilai) query = query.eq('nilai', Number(params.nilai));
    const { data: penilaian } = await query;

    const nilaiRata = penilaian && penilaian.length > 0
        ? penilaian.reduce((sum, p) => sum + p.nilai, 0) / penilaian.length
        : null;

    return (
        <>
            <h1 className="text-lg font-semibold text-gray-800 mb-4">Data Penilaian Pelayanan</h1>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div><label className="block text-xs text-gray-500 mb-1">Dari</label><input type="date" name="dari" defaultValue={dari} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-gray-500 mb-1">Sampai</label><input type="date" name="sampai" defaultValue={sampai} className="border border-gray-300 rounded-lg px-3 py-2 text-sm" /></div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Nilai</label>
                        <select name="nilai" defaultValue={params.nilai ?? ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                            <option value="">Semua Nilai</option>
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-[#003580] text-white px-4 py-2 rounded-lg text-sm font-medium">Tampilkan</button>
                </form>
            </Card>

            {nilaiRata && (
                <div className="mb-5 bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-center gap-4">
                    <div className="text-4xl font-black text-yellow-500">{nilaiRata.toFixed(1)}</div>
                    <div>
                        <div className="text-yellow-600 font-semibold">Rata-rata Penilaian</div>
                        <div className="text-yellow-500 text-sm">dari {penilaian?.length} penilaian</div>
                    </div>
                </div>
            )}

            <Card>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-gray-500 text-left">
                            <th className="pb-3 font-medium">Tanggal</th><th className="pb-3 font-medium">Petugas</th>
                            <th className="pb-3 font-medium">Layanan</th><th className="pb-3 font-medium">Nilai</th>
                            <th className="pb-3 font-medium">Komentar</th><th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {penilaian && penilaian.length > 0 ? penilaian.map((p) => (
                            <tr key={p.id} className="hover:bg-gray-50">
                                <td className="py-3 text-gray-500 text-xs">{new Date(p.antrian.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="py-3 font-medium">{p.profiles?.name}</td>
                                <td className="py-3 text-gray-500 text-xs">{p.antrian.jenis_layanan?.nama_layanan}</td>
                                <td className="py-3"><span className="text-yellow-400 font-bold">{'★'.repeat(p.nilai)}{'☆'.repeat(5 - p.nilai)}</span></td>
                                <td className="py-3 text-gray-600 text-xs max-w-xs">{p.komentar ? p.komentar.slice(0, 60) : '—'}</td>
                                <td className="py-3">
                                    <form action={async () => { await hapusPenilaian(p.id); }}>
                                        <button type="submit" className="text-xs text-red-500 hover:underline">Hapus</button>
                                    </form>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={6} className="py-8 text-center text-gray-400">Belum ada penilaian pada periode ini</td></tr>}
                    </tbody>
                </table>
            </Card>
        </>
    );
}
