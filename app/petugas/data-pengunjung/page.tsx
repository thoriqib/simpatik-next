import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';
import type { Antrian } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

/**
 * Data kontak lengkap pengunjung yang ambil antrian tatap muka (offline)
 * — nama, no HP, email, jenis layanan. Sebelumnya cuma bisa dilihat admin
 * lewat Laporan Antrian (dan tanpa kolom kontak) — sekarang petugas juga
 * bisa akses langsung, termasuk detail kontaknya.
 */
export default async function DataPengunjungPetugasPage({
    searchParams,
}: {
    searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
    noStore();

    const params = await searchParams;
    const today = todayDateStringWIB();
    const dari = params.dari || today;
    const sampai = params.sampai || today;

    const supabase = await createClient();
    const { data: antrianRaw } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(nama_layanan)')
        .gte('tanggal', dari)
        .lte('tanggal', sampai)
        .order('tanggal', { ascending: false })
        .order('nomor_urut');

    // [FIX] Cast eksplisit — relasi to-one (jenis_layanan) ditebak sebagai
    // array tanpa generated types.
    const antrian = antrianRaw as unknown as Antrian[] | null;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Data Pengunjung</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Data kontak pengunjung yang mengambil antrian tatap muka</p>
            </div>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Dari</label>
                        <input type="date" name="dari" defaultValue={dari} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Sampai</label>
                        <input type="date" name="sampai" defaultValue={sampai} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">
                        Tampilkan
                    </button>
                </form>
            </Card>

            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b text-navy-950/50 text-left">
                                <th className="pb-3 font-medium">Tanggal</th>
                                <th className="pb-3 font-medium">Kode</th>
                                <th className="pb-3 font-medium">Nama</th>
                                <th className="pb-3 font-medium">No. HP</th>
                                <th className="pb-3 font-medium">Email</th>
                                <th className="pb-3 font-medium">Layanan</th>
                                <th className="pb-3 font-medium">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {antrian && antrian.length > 0 ? antrian.map((a) => (
                                <tr key={a.id} className="hover:bg-paper-50">
                                    <td className="py-3 text-navy-950/50 whitespace-nowrap">{new Date(a.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="py-3 font-mono font-semibold text-navy-700">{a.kode_antrian}</td>
                                    <td className="py-3 font-medium text-navy-950">{a.nama_pengunjung}</td>
                                    <td className="py-3 text-navy-950/50 font-mono text-xs">{a.no_hp || '-'}</td>
                                    <td className="py-3 text-navy-950/50 text-xs">{a.email || '-'}</td>
                                    <td className="py-3 text-navy-950/60">{a.jenis_layanan?.nama_layanan}</td>
                                    <td className="py-3"><Badge status={a.status} /></td>
                                </tr>
                            )) : <tr><td colSpan={7} className="py-10 text-center text-navy-950/30">Tidak ada data pengunjung pada rentang tanggal ini</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}
