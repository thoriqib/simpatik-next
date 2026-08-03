import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { JadwalForm } from './JadwalForm';
import { CsvImport } from './CsvImport';
import { hapusJadwal } from '@/lib/actions/jadwal';

export const dynamic = 'force-dynamic';

export default async function JadwalPage({ searchParams }: { searchParams: Promise<{ bulan?: string; tahun?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const bulan = Number(params.bulan) || now.getMonth() + 1;
    const tahun = Number(params.tahun) || now.getFullYear();

    const start = new Date(tahun, bulan - 1, 1).toISOString().slice(0, 10);
    const end = new Date(tahun, bulan, 0).toISOString().slice(0, 10);

    const supabase = await createClient();
    const { data: jadwal } = await supabase
        .from('jadwal_piket')
        .select('*, profiles(name), shift_piket(*), presensi(waktu_masuk, waktu_keluar)')
        .gte('tanggal', start)
        .lte('tanggal', end)
        .order('tanggal');

    const { data: petugas } = await supabase.from('profiles').select('id, name').eq('role', 'petugas').order('name');
    const { data: shifts } = await supabase.from('shift_piket').select('*').eq('is_aktif', true);

    const bulanNama = new Date(tahun, bulan - 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-5">Jadwal Piket</h1>

            <CsvImport />

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Bulan</label>
                        <select name="bulan" defaultValue={bulan} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => (
                                <option key={b} value={b}>{new Date(2000, b - 1).toLocaleDateString('id-ID', { month: 'long' })}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Tahun</label>
                        <select name="tahun" defaultValue={tahun} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                            {[tahun - 1, tahun, tahun + 1].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Tampilkan</button>
                </form>
            </Card>

            <Card title={`Jadwal Bulan ${bulanNama}`}>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tanggal</th><th className="pb-3 font-medium">Petugas</th>
                            <th className="pb-3 font-medium">Shift</th><th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Masuk</th><th className="pb-3 font-medium">Keluar</th><th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {jadwal && jadwal.length > 0 ? jadwal.map((j) => (
                            <tr key={j.id} className="hover:bg-paper-50">
                                <td className="py-3">{new Date(j.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                <td className="py-3 font-medium">{j.profiles?.name}</td>
                                <td className="py-3">{j.shift_piket?.nama_shift} <span className="text-navy-950/30 text-xs">({j.shift_piket?.jam_mulai}–{j.shift_piket?.jam_selesai})</span></td>
                                <td className="py-3"><Badge status={j.status} /></td>
                                <td className="py-3 text-navy-950/60">{j.presensi?.[0]?.waktu_masuk ? new Date(j.presensi[0].waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-'}</td>
                                <td className="py-3 text-navy-950/60">{j.presensi?.[0]?.waktu_keluar ? new Date(j.presensi[0].waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-'}</td>
                                <td className="py-3">
                                    <form action={async () => { await hapusJadwal(j.id); }}>
                                        <button type="submit" className="text-red-500 hover:underline text-xs">Hapus</button>
                                    </form>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={7} className="py-8 text-center text-navy-950/30">Belum ada jadwal untuk bulan ini</td></tr>}
                    </tbody>
                </table>
            </Card>

            <Card title="Tambah Jadwal Piket Manual" className="mt-5">
                <JadwalForm petugas={petugas ?? []} shifts={shifts ?? []} />
            </Card>
        </>
    );
}
