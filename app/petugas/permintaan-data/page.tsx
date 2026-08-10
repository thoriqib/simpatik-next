import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import type { PermintaanData } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

const KEGUNAAN_LABEL: Record<string, string> = {
    kedinasan: 'Kedinasan/Pekerjaan',
    pribadi: 'Pribadi/Sekolah/Kuliah',
};

export default async function PermintaanDataPetugasPage() {
    const supabase = await createClient();

    // [FIX] Cast eksplisit — konsisten dengan pola di seluruh proyek.
    const { data: permintaanRaw } = await supabase
        .from('permintaan_data')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
    const permintaan = permintaanRaw as unknown as PermintaanData[] | null;

    return (
        <>
            <div className="mb-5">
                <h1 className="text-lg font-semibold text-navy-950">Permintaan Data Pengunjung</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">
                    Daftar permintaan/konsultasi data dari pengunjung publik (tampilan baca saja — untuk menanggapi, hubungi Admin).
                </p>
            </div>

            <Card>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tgl Masuk</th>
                            <th className="pb-3 font-medium">Nama & Instansi</th>
                            <th className="pb-3 font-medium">Kegunaan</th>
                            <th className="pb-3 font-medium">Kontak</th>
                            <th className="pb-3 font-medium">Kebutuhan</th>
                            <th className="pb-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {permintaan && permintaan.length > 0 ? permintaan.map((p) => (
                            <tr key={p.id} className="hover:bg-paper-50">
                                <td className="py-3 text-navy-950/50 text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                <td className="py-3">
                                    <div className="font-medium text-navy-950">{p.nama_lengkap}</div>
                                    <div className="text-xs text-navy-950/40">{p.instansi}</div>
                                </td>
                                <td className="py-3 text-xs text-navy-950/60">{KEGUNAAN_LABEL[p.kegunaan_data] ?? p.kegunaan_data}</td>
                                <td className="py-3 text-xs text-navy-950/60">
                                    <div>{p.email}</div>
                                    <div>{p.no_hp}</div>
                                </td>
                                <td className="py-3 text-xs text-navy-950/60 max-w-xs">{p.kebutuhan_data.slice(0, 80)}{p.kebutuhan_data.length > 80 ? '…' : ''}</td>
                                <td className="py-3"><Badge status={p.status} /></td>
                            </tr>
                        )) : <tr><td colSpan={6} className="py-10 text-center text-navy-950/30">Belum ada permintaan data masuk</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}
