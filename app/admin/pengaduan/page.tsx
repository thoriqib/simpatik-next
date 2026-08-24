import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import type { Pengaduan } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function PengaduanListPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
    noStore();

    const { status } = await searchParams;
    const supabase = await createClient();

    let query = supabase.from('pengaduan').select('*, profiles(name)').order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);

    // [FIX] Cast eksplisit — relasi to-one `profiles` ditebak sebagai array
    // tanpa generated types, padahal runtime-nya objek tunggal.
    const { data: pengaduanRaw } = await query;
    const pengaduan = pengaduanRaw as unknown as Pengaduan[] | null;

    // [FITUR BARU] Jumlah pesan per pengaduan — dua query terpisah lalu
    // digabung manual (bukan embed), konsisten dengan pola yang terbukti
    // andal di halaman lain (lihat catatan lengkap di app/petugas/dashboard/page.tsx).
    const pengaduanIds = (pengaduan ?? []).map((p) => p.id);
    const { data: semuaPesan } = await supabase
        .from('pengaduan_pesan')
        .select('pengaduan_id')
        .in('pengaduan_id', pengaduanIds.length > 0 ? pengaduanIds : [-1]);
    const jumlahPesanByPengaduanId = new Map<number, number>();
    (semuaPesan ?? []).forEach((p) => {
        jumlahPesanByPengaduanId.set(p.pengaduan_id, (jumlahPesanByPengaduanId.get(p.pengaduan_id) ?? 0) + 1);
    });

    const { count: jumlahBaru } = await supabase.from('pengaduan').select('*', { count: 'exact', head: true }).eq('status', 'baru');
    const { count: jumlahDiproses } = await supabase.from('pengaduan').select('*', { count: 'exact', head: true }).eq('status', 'diproses');

    const tabs = [
        { key: '', label: 'Semua' },
        { key: 'baru', label: 'Baru', count: jumlahBaru },
        { key: 'diproses', label: 'Diproses', count: jumlahDiproses },
        { key: 'selesai', label: 'Selesai' },
    ];

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-4">Daftar Pengaduan</h1>

            <div className="flex gap-2 mb-5 flex-wrap">
                {tabs.map((tab) => (
                    <Link key={tab.key} href={tab.key ? `/admin/pengaduan?status=${tab.key}` : '/admin/pengaduan'}
                        className={`px-4 py-2 rounded-xl text-sm font-medium transition ${(status ?? '') === tab.key ? 'bg-navy-700 text-white' : 'bg-white text-navy-950/60 border hover:bg-paper-50'}`}>
                        {tab.label} {tab.count ? <span className="ml-1 text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full">{tab.count}</span> : null}
                    </Link>
                ))}
            </div>

            <Card>
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tgl Masuk</th><th className="pb-3 font-medium">Subjek</th>
                            <th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Percakapan</th>
                            <th className="pb-3 font-medium">Ditangani</th><th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {pengaduan && pengaduan.length > 0 ? pengaduan.map((p) => (
                            <tr key={p.id} className={`hover:bg-paper-50 ${p.status === 'baru' ? 'border-l-4 border-l-red-400' : ''}`}>
                                <td className="py-3 text-navy-950/50 text-xs">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="py-3">
                                    <div className="font-medium text-navy-950">{p.subjek}</div>
                                    <div className="text-xs text-navy-950/30 mt-0.5">{p.isi_pengaduan.slice(0, 60)}</div>
                                </td>
                                <td className="py-3"><Badge status={p.status} /></td>
                                <td className="py-3">
                                    {jumlahPesanByPengaduanId.has(p.id) ? (
                                        <span className="inline-flex items-center gap-1 text-xs text-navy-950/50">
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            {jumlahPesanByPengaduanId.get(p.id)} pesan
                                        </span>
                                    ) : (
                                        <span className="text-xs text-navy-950/20">—</span>
                                    )}
                                </td>
                                <td className="py-3 text-navy-950/50 text-sm">{p.profiles?.name ?? '—'}</td>
                                <td className="py-3">
                                    <Link href={`/admin/pengaduan/${p.id}`} className="text-xs font-medium bg-azure-500/10 text-navy-700 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition">Detail →</Link>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={6} className="py-10 text-center text-navy-950/30">Tidak ada pengaduan</td></tr>}
                    </tbody>
                </table>
            </Card>
        </>
    );
}
