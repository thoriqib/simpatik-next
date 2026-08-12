import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { hapusPenilaian } from '@/lib/actions/penilaian';
import { Ticket, Globe } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

type PenilaianRow = {
    id: number;
    nilai: number;
    komentar: string | null;
    created_at: string;
    antrian_id: number | null;
    permintaan_data_id: number | null;
    profiles: { name: string } | null;
};

export default async function PenilaianAdminPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string; nilai?: string; sumber?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const dari = params.dari || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const sampai = params.sampai || now.toISOString().slice(0, 10);

    const supabase = await createClient();

    // [FIX BUG] Sebelumnya query pakai `antrian!inner(...)` — inner join
    // ini otomatis MENGECUALIKAN penilaian layanan online (permintaan
    // data), karena baris itu antrian_id-nya NULL (pakai permintaan_data_id
    // sebagai gantinya). Sekarang filter berdasar created_at penilaian itu
    // sendiri (konsisten untuk kedua sumber), lalu detail antrian/permintaan
    // data diambil terpisah dan digabung manual — bukan lewat embed yang
    // berpotensi mengecualikan salah satu sumber.
    let query = supabase
        .from('penilaian')
        .select('id, nilai, komentar, created_at, antrian_id, permintaan_data_id, profiles(name)')
        .gte('created_at', `${dari}T00:00:00`)
        .lte('created_at', `${sampai}T23:59:59`)
        .order('created_at', { ascending: false });

    if (params.nilai) query = query.eq('nilai', Number(params.nilai));
    if (params.sumber === 'offline') query = query.not('antrian_id', 'is', null);
    if (params.sumber === 'online') query = query.not('permintaan_data_id', 'is', null);

    const { data: penilaianRaw } = await query;
    const penilaian = penilaianRaw as unknown as PenilaianRow[] | null;

    const antrianIds = (penilaian ?? []).filter((p) => p.antrian_id).map((p) => p.antrian_id as number);
    const permintaanIds = (penilaian ?? []).filter((p) => p.permintaan_data_id).map((p) => p.permintaan_data_id as number);

    const { data: antrianList } = await supabase
        .from('antrian')
        .select('id, jenis_layanan(nama_layanan)')
        .in('id', antrianIds.length > 0 ? antrianIds : [-1]);
    const { data: permintaanList } = await supabase
        .from('permintaan_data')
        .select('id, nama_lengkap, instansi')
        .in('id', permintaanIds.length > 0 ? permintaanIds : [-1]);

    type AntrianInfo = { id: number; jenis_layanan: { nama_layanan: string } | null };
    type PermintaanInfo = { id: number; nama_lengkap: string; instansi: string };
    const antrianMap = new Map(((antrianList ?? []) as unknown as AntrianInfo[]).map((a) => [a.id, a]));
    const permintaanMap = new Map(((permintaanList ?? []) as unknown as PermintaanInfo[]).map((p) => [p.id, p]));

    const nilaiRata = penilaian && penilaian.length > 0
        ? penilaian.reduce((sum, p) => sum + p.nilai, 0) / penilaian.length
        : null;

    const jumlahOffline = (penilaian ?? []).filter((p) => p.antrian_id).length;
    const jumlahOnline = (penilaian ?? []).filter((p) => p.permintaan_data_id).length;

    const tabs = [
        { key: '', label: 'Semua' },
        { key: 'offline', label: 'Antrian (Offline)' },
        { key: 'online', label: 'Permintaan Data (Online)' },
    ];

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-4">Data Penilaian Pelayanan</h1>

            <div className="flex gap-2 mb-5 flex-wrap">
                {tabs.map((tab) => {
                    const qs = new URLSearchParams({ dari, sampai, ...(params.nilai ? { nilai: params.nilai } : {}), ...(tab.key ? { sumber: tab.key } : {}) });
                    return (
                        <Link
                            key={tab.key}
                            href={`/admin/penilaian?${qs.toString()}`}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${(params.sumber ?? '') === tab.key ? 'bg-navy-700 text-white' : 'bg-white text-navy-950/70 border border-paper-200 hover:bg-paper-50'}`}
                        >
                            {tab.label}
                        </Link>
                    );
                })}
            </div>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    {params.sumber && <input type="hidden" name="sumber" value={params.sumber} />}
                    <div><label className="block text-xs text-navy-950/50 mb-1">Dari</label><input type="date" name="dari" defaultValue={dari} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" /></div>
                    <div><label className="block text-xs text-navy-950/50 mb-1">Sampai</label><input type="date" name="sampai" defaultValue={sampai} className="border border-paper-200 rounded-xl px-3 py-2 text-sm" /></div>
                    <div>
                        <label className="block text-xs text-navy-950/50 mb-1">Nilai</label>
                        <select name="nilai" defaultValue={params.nilai ?? ''} className="border border-paper-200 rounded-xl px-3 py-2 text-sm">
                            <option value="">Semua Nilai</option>
                            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)} ({n})</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium">Tampilkan</button>
                </form>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {nilaiRata && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 flex items-center gap-4">
                        <div className="text-4xl font-black text-yellow-500">{nilaiRata.toFixed(1)}</div>
                        <div>
                            <div className="text-yellow-600 font-semibold text-sm">Rata-rata Penilaian</div>
                            <div className="text-yellow-500 text-xs">dari {penilaian?.length} penilaian</div>
                        </div>
                    </div>
                )}
                <div className="bg-navy-700/5 border border-navy-700/10 rounded-xl px-5 py-4 flex items-center gap-3">
                    <Ticket className="w-6 h-6 text-navy-700" />
                    <div>
                        <div className="font-mono text-xl font-semibold text-navy-950 tabular">{jumlahOffline}</div>
                        <div className="text-xs text-navy-950/50">Penilaian Antrian (Offline)</div>
                    </div>
                </div>
                <div className="bg-emerald-600/5 border border-emerald-600/10 rounded-xl px-5 py-4 flex items-center gap-3">
                    <Globe className="w-6 h-6 text-emerald-600" />
                    <div>
                        <div className="font-mono text-xl font-semibold text-navy-950 tabular">{jumlahOnline}</div>
                        <div className="text-xs text-navy-950/50">Penilaian Permintaan Data (Online)</div>
                    </div>
                </div>
            </div>

            <Card>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tanggal</th><th className="pb-3 font-medium">Petugas</th>
                            <th className="pb-3 font-medium">Sumber</th><th className="pb-3 font-medium">Layanan/Pengunjung</th>
                            <th className="pb-3 font-medium">Nilai</th>
                            <th className="pb-3 font-medium">Komentar</th><th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {penilaian && penilaian.length > 0 ? penilaian.map((p) => {
                            const isOnline = !!p.permintaan_data_id;
                            const antrianInfo = p.antrian_id ? antrianMap.get(p.antrian_id) : null;
                            const permintaanInfo = p.permintaan_data_id ? permintaanMap.get(p.permintaan_data_id) : null;
                            return (
                                <tr key={p.id} className="hover:bg-paper-50">
                                    <td className="py-3 text-navy-950/50 text-xs whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="py-3 font-medium">{p.profiles?.name}</td>
                                    <td className="py-3">
                                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isOnline ? 'bg-emerald-500/10 text-emerald-600' : 'bg-navy-700/10 text-navy-700'}`}>
                                            {isOnline ? <Globe className="w-3 h-3" /> : <Ticket className="w-3 h-3" />}
                                            {isOnline ? 'Online' : 'Offline'}
                                        </span>
                                    </td>
                                    <td className="py-3 text-navy-950/50 text-xs">
                                        {isOnline ? (permintaanInfo ? `${permintaanInfo.nama_lengkap} (${permintaanInfo.instansi})` : '-') : (antrianInfo?.jenis_layanan?.nama_layanan ?? '-')}
                                    </td>
                                    <td className="py-3"><span className="text-yellow-400 font-bold">{'★'.repeat(p.nilai)}{'☆'.repeat(5 - p.nilai)}</span></td>
                                    <td className="py-3 text-navy-950/60 text-xs max-w-xs">{p.komentar ? p.komentar.slice(0, 60) : '—'}</td>
                                    <td className="py-3">
                                        {/* [FIX] .bind() — lihat catatan di app/admin/jadwal/page.tsx */}
                                        <form action={hapusPenilaian.bind(null, p.id)}>
                                            <button type="submit" className="text-xs text-red-500 hover:underline">Hapus</button>
                                        </form>
                                    </td>
                                </tr>
                            );
                        }) : <tr><td colSpan={7} className="py-8 text-center text-navy-950/30">Belum ada penilaian pada periode ini</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}
