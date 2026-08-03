import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    const supabase = await createClient();
    const today = todayDateStringWIB();

    const { count: totalPetugas } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'petugas');
    const { count: antrianHariIni } = await supabase.from('antrian').select('*', { count: 'exact', head: true }).eq('tanggal', today);
    const { count: antrianSelesai } = await supabase.from('antrian').select('*', { count: 'exact', head: true }).eq('tanggal', today).eq('status', 'selesai');
    const { count: pengaduanBaru } = await supabase.from('pengaduan').select('*', { count: 'exact', head: true }).eq('status', 'baru');

    const { data: antrianAktif } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(nama_layanan), profiles(name)')
        .eq('tanggal', today)
        .in('status', ['menunggu', 'dipanggil', 'dilayani'])
        .order('nomor_urut');

    return (
        <>
            <h1 className="text-lg font-semibold text-gray-800 mb-4">Dashboard</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
                <Card><div className="text-2xl font-bold text-gray-800">{totalPetugas ?? 0}</div><div className="text-sm text-gray-500">Total Petugas</div></Card>
                <Card><div className="text-2xl font-bold text-gray-800">{antrianHariIni ?? 0}</div><div className="text-sm text-gray-500">Antrian Hari Ini</div></Card>
                <Card><div className="text-2xl font-bold text-gray-800">{antrianSelesai ?? 0}</div><div className="text-sm text-gray-500">Selesai Dilayani</div></Card>
                <Card><div className="text-2xl font-bold text-gray-800">{pengaduanBaru ?? 0}</div><div className="text-sm text-gray-500">Pengaduan Baru</div></Card>
            </div>

            <Card title="Antrian Aktif Hari Ini">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-gray-500 text-left">
                            <th className="pb-3 font-medium">Kode</th>
                            <th className="pb-3 font-medium">Nama Pengunjung</th>
                            <th className="pb-3 font-medium">Jenis Layanan</th>
                            <th className="pb-3 font-medium">Petugas</th>
                            <th className="pb-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {antrianAktif && antrianAktif.length > 0 ? antrianAktif.map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="py-3 font-mono font-semibold text-blue-700">{item.kode_antrian}</td>
                                <td className="py-3">{item.nama_pengunjung}</td>
                                <td className="py-3">{item.jenis_layanan?.nama_layanan}</td>
                                <td className="py-3">{item.profiles?.name ?? '-'}</td>
                                <td className="py-3"><Badge status={item.status} /></td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="py-8 text-center text-gray-400">Belum ada antrian hari ini</td></tr>
                        )}
                    </tbody>
                </table>
            </Card>
        </>
    );
}
