import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { todayDateStringWIB } from '@/lib/utils';
import { Users, Ticket, CheckCircle2, MessageSquareWarning } from 'lucide-react';
import type { Antrian } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const STAT_ICONS = [Users, Ticket, CheckCircle2, MessageSquareWarning];

export default async function AdminDashboard() {
    const supabase = await createClient();
    const today = todayDateStringWIB();

    const { count: totalPetugas } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'petugas');
    const { count: antrianHariIni } = await supabase.from('antrian').select('*', { count: 'exact', head: true }).eq('tanggal', today);
    const { count: antrianSelesai } = await supabase.from('antrian').select('*', { count: 'exact', head: true }).eq('tanggal', today).eq('status', 'selesai');
    const { count: pengaduanBaru } = await supabase.from('pengaduan').select('*', { count: 'exact', head: true }).eq('status', 'baru');

    // [FIX] Cast eksplisit — relasi to-one (jenis_layanan, profiles) ditebak
    // sebagai array tanpa generated types.
    const { data: antrianAktifRaw } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(nama_layanan), profiles(name)')
        .eq('tanggal', today)
        .in('status', ['menunggu', 'dipanggil', 'dilayani'])
        .order('nomor_urut');

    const antrianAktif = antrianAktifRaw as unknown as Antrian[] | null;

    const stats = [
        { label: 'Total Petugas', value: totalPetugas ?? 0, tint: 'bg-azure-500/10 text-azure-500' },
        { label: 'Antrian Hari Ini', value: antrianHariIni ?? 0, tint: 'bg-navy-700/10 text-navy-700' },
        { label: 'Selesai Dilayani', value: antrianSelesai ?? 0, tint: 'bg-emerald-500/10 text-emerald-600' },
        { label: 'Pengaduan Baru', value: pengaduanBaru ?? 0, tint: 'bg-rose-500/10 text-rose-600' },
    ];

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Dashboard</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Ringkasan aktivitas pelayanan hari ini</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
                {stats.map((s, i) => {
                    const Icon = STAT_ICONS[i];
                    return (
                        <Card key={s.label} className="!p-5">
                            <div className="flex items-center gap-4">
                                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.tint}`}>
                                    <Icon className="w-5 h-5" strokeWidth={2} />
                                </div>
                                <div>
                                    <div className="font-mono text-2xl font-semibold text-navy-950 tabular">{s.value}</div>
                                    <div className="text-xs text-navy-950/50">{s.label}</div>
                                </div>
                            </div>
                        </Card>
                    );
                })}
            </div>

            <Card title="Antrian Aktif Hari Ini">
                <div className="overflow-x-auto -mx-6 px-6">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-paper-200 text-navy-950/40 text-left text-xs uppercase tracking-wide">
                            <th className="pb-3 font-medium">Kode</th>
                            <th className="pb-3 font-medium">Nama Pengunjung</th>
                            <th className="pb-3 font-medium">Jenis Layanan</th>
                            <th className="pb-3 font-medium">Petugas</th>
                            <th className="pb-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-paper-100">
                        {antrianAktif && antrianAktif.length > 0 ? antrianAktif.map((item) => (
                            <tr key={item.id} className="hover:bg-paper-50 transition-colors">
                                <td className="py-3 font-mono font-semibold text-navy-700 tabular">{item.kode_antrian}</td>
                                <td className="py-3 text-navy-950">{item.nama_pengunjung}</td>
                                <td className="py-3 text-navy-950/60">{item.jenis_layanan?.nama_layanan}</td>
                                <td className="py-3 text-navy-950/60">{item.profiles?.name ?? '-'}</td>
                                <td className="py-3"><Badge status={item.status} /></td>
                            </tr>
                        )) : (
                            <tr><td colSpan={5} className="py-10 text-center text-navy-950/30">Belum ada antrian hari ini</td></tr>
                        )}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}
