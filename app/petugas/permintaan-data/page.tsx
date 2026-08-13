import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import Link from 'next/link';
import { unstable_noStore as noStore } from 'next/cache';
import type { PermintaanData } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const KEGUNAAN_LABEL: Record<string, string> = {
    kedinasan: 'Kedinasan/Pekerjaan',
    pribadi: 'Pribadi/Sekolah/Kuliah',
};

export default async function PermintaanDataPetugasPage() {
    // [FIX BUG] Lihat catatan lengkap di app/petugas/dashboard/page.tsx
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // [FIX] Cast eksplisit — konsisten dengan pola di seluruh proyek.
    const { data: permintaanRaw } = await supabase
        .from('permintaan_data')
        .select('*, profiles(name)')
        .order('created_at', { ascending: false })
        .limit(50);
    const permintaan = permintaanRaw as unknown as PermintaanData[] | null;

    return (
        <>
            <div className="mb-5">
                <h1 className="text-lg font-semibold text-navy-950">Permintaan Data Pengunjung</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">
                    Semua permintaan/konsultasi data dari pengunjung publik. Klik &quot;Detail&quot; untuk menindaklanjuti atau mengambil alih.
                </p>
            </div>

            <Card>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tgl Masuk</th>
                            <th className="pb-3 font-medium">Jam Masuk</th>
                            <th className="pb-3 font-medium">Nama & Instansi</th>
                            <th className="pb-3 font-medium">Kegunaan</th>
                            <th className="pb-3 font-medium">Ditangani Oleh</th>
                            <th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {permintaan && permintaan.length > 0 ? permintaan.map((p) => {
                            const punyaKu = p.ditangani_oleh === user?.id;
                            return (
                                <tr key={p.id} className={`hover:bg-paper-50 ${p.status === 'baru' ? 'border-l-4 border-l-rose-400' : punyaKu ? 'border-l-4 border-l-azure-500' : ''}`}>
                                    <td className="py-3 text-navy-950/50 text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="py-3 text-navy-950/50 text-xs whitespace-nowrap font-mono tabular">{new Date(p.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB</td>
                                    <td className="py-3">
                                        <div className="font-medium text-navy-950">{p.nama_lengkap}</div>
                                        <div className="text-xs text-navy-950/40">{p.instansi}</div>
                                    </td>
                                    <td className="py-3 text-xs text-navy-950/60">{KEGUNAAN_LABEL[p.kegunaan_data] ?? p.kegunaan_data}</td>
                                    <td className="py-3 text-xs text-navy-950/60">
                                        {p.profiles?.name ? (
                                            <span className={punyaKu ? 'font-semibold text-azure-500' : ''}>{p.profiles.name}{punyaKu && ' (Saya)'}</span>
                                        ) : <span className="text-navy-950/30 italic">Belum ada</span>}
                                    </td>
                                    <td className="py-3"><Badge status={p.status} /></td>
                                    <td className="py-3">
                                        <Link href={`/petugas/permintaan-data/${p.id}`} className="text-xs font-medium bg-azure-500/10 text-azure-500 px-3 py-1.5 rounded-lg hover:bg-azure-500/20 transition-colors">Detail →</Link>
                                    </td>
                                </tr>
                            );
                        }) : <tr><td colSpan={7} className="py-10 text-center text-navy-950/30">Belum ada permintaan data masuk</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}
