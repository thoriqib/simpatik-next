import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Ticket, Globe } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LaporanLayananPage({ searchParams }: { searchParams: Promise<{ dari?: string; sampai?: string }> }) {
    const params = await searchParams;
    const now = new Date();
    const dari = params.dari || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const sampai = params.sampai || now.toISOString().slice(0, 10);

    const supabase = await createClient();

    const { data: petugasList } = await supabase.from('profiles').select('id, name').eq('role', 'petugas').order('name');

    // ── Layanan offline (antrian tatap muka) ──────────────────────
    type AntrianRow = { petugas_id: string | null };
    const { data: antrianRaw } = await supabase
        .from('antrian')
        .select('petugas_id')
        .eq('status', 'selesai')
        .gte('tanggal', dari).lte('tanggal', sampai);
    const antrianList = antrianRaw as unknown as AntrianRow[] | null;

    // ── Layanan online (permintaan data yang diselesaikan) ────────
    type PermintaanDataRow = { ditangani_oleh: string | null };
    const { data: permintaanDataRaw } = await supabase
        .from('permintaan_data')
        .select('ditangani_oleh')
        .eq('status', 'selesai')
        .gte('ditanggapi_pada', `${dari}T00:00:00`)
        .lte('ditanggapi_pada', `${sampai}T23:59:59`);
    const permintaanDataList = permintaanDataRaw as unknown as PermintaanDataRow[] | null;

    const rekapMap = new Map<string, { nama: string; offline: number; online: number }>();
    (petugasList ?? []).forEach((p) => rekapMap.set(p.id, { nama: p.name, offline: 0, online: 0 }));

    (antrianList ?? []).forEach((a) => {
        if (!a.petugas_id) return;
        const r = rekapMap.get(a.petugas_id);
        if (r) r.offline++;
    });

    (permintaanDataList ?? []).forEach((pd) => {
        if (!pd.ditangani_oleh) return;
        const r = rekapMap.get(pd.ditangani_oleh);
        if (r) r.online++;
    });

    const rekap = Array.from(rekapMap.values())
        .map((r) => ({ ...r, total: r.offline + r.online }))
        .sort((a, b) => b.total - a.total);

    const totalOffline = rekap.reduce((sum, r) => sum + r.offline, 0);
    const totalOnline = rekap.reduce((sum, r) => sum + r.online, 0);

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-4">Rekap Layanan Petugas</h1>
            <p className="text-sm text-navy-950/50 -mt-3 mb-5">
                Perbandingan jumlah pengunjung yang dilayani tatap muka (antrian) vs permintaan data online per petugas.
                Data ini juga jadi dasar perhitungan skor <strong>Petugas Terbaik Triwulanan</strong>.
            </p>

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
                    <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">Tampilkan</button>
                </form>
            </Card>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <Card className="!p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy-700/10 text-navy-700 flex items-center justify-center shrink-0">
                            <Ticket className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-mono text-2xl font-semibold text-navy-950 tabular">{totalOffline}</div>
                            <div className="text-xs text-navy-950/50">Total Layanan Offline (Antrian)</div>
                        </div>
                    </div>
                </Card>
                <Card className="!p-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0">
                            <Globe className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="font-mono text-2xl font-semibold text-navy-950 tabular">{totalOnline}</div>
                            <div className="text-xs text-navy-950/50">Total Layanan Online (Permintaan Data)</div>
                        </div>
                    </div>
                </Card>
            </div>

            <Card title="Rekap per Petugas">
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Petugas</th>
                            <th className="pb-3 font-medium text-center">
                                <span className="inline-flex items-center gap-1"><Ticket className="w-3.5 h-3.5" /> Offline</span>
                            </th>
                            <th className="pb-3 font-medium text-center">
                                <span className="inline-flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> Online</span>
                            </th>
                            <th className="pb-3 font-medium text-center">Total</th>
                            <th className="pb-3 font-medium text-center">Proporsi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {rekap.length > 0 ? rekap.map((r) => {
                            const persenOffline = r.total > 0 ? (r.offline / r.total) * 100 : 0;
                            return (
                                <tr key={r.nama} className="hover:bg-paper-50">
                                    <td className="py-3 font-medium text-navy-950">{r.nama}</td>
                                    <td className="py-3 text-center text-navy-700 font-semibold tabular">{r.offline}</td>
                                    <td className="py-3 text-center text-emerald-600 font-semibold tabular">{r.online}</td>
                                    <td className="py-3 text-center font-mono font-bold text-navy-950 tabular">{r.total}</td>
                                    <td className="py-3">
                                        {r.total > 0 ? (
                                            <div className="flex h-2 rounded-full overflow-hidden bg-paper-100 w-32 mx-auto">
                                                <div className="bg-navy-700" style={{ width: `${persenOffline}%` }} />
                                                <div className="bg-emerald-500" style={{ width: `${100 - persenOffline}%` }} />
                                            </div>
                                        ) : <span className="text-navy-950/20 text-xs block text-center">—</span>}
                                    </td>
                                </tr>
                            );
                        }) : <tr><td colSpan={5} className="py-10 text-center text-navy-950/30">Belum ada data layanan pada periode ini</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
    );
}
