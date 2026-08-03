import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function LaporanAntrianPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string; status?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const dari = params.dari || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const sampai = params.sampai || now.toISOString().slice(0, 10);
    const statusFilter = params.status || 'semua';

    const supabase = await createClient();
    let query = supabase.from('antrian').select('*, jenis_layanan(nama_layanan), profiles(name)')
        .gte('tanggal', dari).lte('tanggal', sampai).order('tanggal').order('nomor_urut');
    if (statusFilter !== 'semua') query = query.eq('status', statusFilter);
    const { data: antrian } = await query;

    const total = antrian?.length ?? 0;
    const selesai = antrian?.filter((a) => a.status === 'selesai').length ?? 0;
    const batal = antrian?.filter((a) => a.status === 'batal').length ?? 0;
    const durasiList = (antrian ?? [])
        .filter((a) => a.status === 'selesai' && a.waktu_mulai_layanan && a.waktu_selesai)
        .map((a) => (new Date(a.waktu_selesai!).getTime() - new Date(a.waktu_mulai_layanan!).getTime()) / 60000);
    const avgDurasi = durasiList.length ? Math.round(durasiList.reduce((a, b) => a + b, 0) / durasiList.length) : null;

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-4">Laporan Antrian</h1>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div><label className="block text-sm font-medium text-navy-950/80 mb-1">Dari</label><input type="date" name="dari" defaultValue={dari} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" /></div>
                    <div><label className="block text-sm font-medium text-navy-950/80 mb-1">Sampai</label><input type="date" name="sampai" defaultValue={sampai} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" /></div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Status</label>
                        <select name="status" defaultValue={statusFilter} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                            <option value="semua">Semua Status</option>
                            {['menunggu', 'dipanggil', 'dilayani', 'selesai', 'batal'].map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Tampilkan</button>
                </form>
            </Card>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                <Card><div className="text-2xl font-bold text-navy-950">{total}</div><div className="text-sm text-navy-950/50">Total Antrian</div></Card>
                <Card><div className="text-2xl font-bold text-green-600">{selesai}</div><div className="text-sm text-navy-950/50">Selesai</div></Card>
                <Card><div className="text-2xl font-bold text-red-500">{batal}</div><div className="text-sm text-navy-950/50">Batal</div></Card>
                <Card><div className="text-2xl font-bold text-azure-500">{avgDurasi ? `${avgDurasi} mnt` : '-'}</div><div className="text-sm text-navy-950/50">Rata-rata Layanan</div></Card>
            </div>

            <Card>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tanggal</th><th className="pb-3 font-medium">Kode</th><th className="pb-3 font-medium">Nama Pengunjung</th>
                            <th className="pb-3 font-medium">Layanan</th><th className="pb-3 font-medium">Petugas</th><th className="pb-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {antrian && antrian.length > 0 ? antrian.map((a) => (
                            <tr key={a.id} className="hover:bg-paper-50">
                                <td className="py-3 text-navy-950/50">{new Date(a.tanggal).toLocaleDateString('id-ID')}</td>
                                <td className="py-3 font-mono font-semibold text-navy-700">{a.kode_antrian}</td>
                                <td className="py-3">{a.nama_pengunjung}</td>
                                <td className="py-3 text-navy-950/60">{a.jenis_layanan?.nama_layanan}</td>
                                <td className="py-3 text-navy-950/60">{a.profiles?.name ?? '-'}</td>
                                <td className="py-3"><Badge status={a.status} /></td>
                            </tr>
                        )) : <tr><td colSpan={6} className="py-8 text-center text-navy-950/30">Tidak ada data antrian</td></tr>}
                    </tbody>
                </table>
            </Card>
        </>
    );
}
