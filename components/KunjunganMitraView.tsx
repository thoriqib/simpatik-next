import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { todayDateStringWIB } from '@/lib/utils';
import { HapusKunjunganMitraButton } from './HapusKunjunganMitraButton';
import type { KunjunganMitra } from '@/lib/types/database';

/**
 * Tampilan daftar kunjungan Mitra Statistik — dipakai bersama oleh
 * /admin/kunjungan-mitra dan /petugas/kunjungan-mitra (pola sama dengan
 * JadwalPetugasView/BantuanStafContent: satu komponen, dua route
 * wrapper, hindari duplikasi).
 */
export async function KunjunganMitraView({ dari, sampai, bisaHapus }: { dari?: string; sampai?: string; bisaHapus: boolean }) {
    const today = todayDateStringWIB();
    const dariFinal = dari || today;
    const sampaiFinal = sampai || today;

    const supabase = await createClient();
    const { data: kunjunganRaw } = await supabase
        .from('kunjungan_mitra')
        .select('*')
        .gte('created_at', `${dariFinal}T00:00:00`)
        .lte('created_at', `${sampaiFinal}T23:59:59`)
        .order('created_at', { ascending: false });

    const kunjungan = (kunjunganRaw ?? []) as KunjunganMitra[];

    return (
        <>
            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Dari</label>
                        <input type="date" name="dari" defaultValue={dariFinal} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Sampai</label>
                        <input type="date" name="sampai" defaultValue={sampaiFinal} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" />
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
                                <th className="pb-3 font-medium">Waktu</th>
                                <th className="pb-3 font-medium">Nama</th>
                                <th className="pb-3 font-medium">No. HP</th>
                                <th className="pb-3 font-medium">Keperluan</th>
                                {bisaHapus && <th className="pb-3 font-medium">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {kunjungan.length > 0 ? kunjungan.map((k) => (
                                <tr key={k.id} className="hover:bg-paper-50">
                                    <td className="py-3 text-navy-950/50 whitespace-nowrap">
                                        {new Date(k.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                                    </td>
                                    <td className="py-3 font-medium text-navy-950">{k.nama}</td>
                                    <td className="py-3 text-navy-950/50 font-mono text-xs">{k.no_hp}</td>
                                    <td className="py-3 text-navy-950/60 max-w-xs truncate" title={k.keperluan}>{k.keperluan}</td>
                                    {bisaHapus && (
                                        <td className="py-3">
                                            <HapusKunjunganMitraButton id={k.id} nama={k.nama} />
                                        </td>
                                    )}
                                </tr>
                            )) : (
                                <tr><td colSpan={bisaHapus ? 5 : 4} className="py-10 text-center text-navy-950/30">Tidak ada kunjungan Mitra Statistik pada rentang tanggal ini</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>
        </>
    );
}
