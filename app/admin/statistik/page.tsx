import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { todayDateStringWIB } from '@/lib/utils';
import { StatistikCharts } from './StatistikCharts';
import { Ticket, Globe, Star, Clock3 } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

const NAMA_BULAN = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];

export default async function StatistikAdminPage() {
    noStore();

    const supabase = await createClient();
    const now = new Date();

    // 6 bulan terakhir termasuk bulan berjalan
    const bulanList: { key: string; label: string; year: number; month: number }[] = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        bulanList.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: NAMA_BULAN[d.getMonth()], year: d.getFullYear(), month: d.getMonth() + 1 });
    }
    const startStr = `${bulanList[0].year}-${String(bulanList[0].month).padStart(2, '0')}-01`;

    // ── Ambil data mentah 6 bulan terakhir — diagregasi di JS, bukan
    // lewat function database baru, supaya logikanya mudah dicek/diubah
    // langsung di sini tanpa perlu migration terpisah. Volume data untuk
    // skala satu kantor kota masih wajar diproses begini. ──────────────
    const { data: antrianRaw } = await supabase
        .from('antrian').select('tanggal, status')
        .gte('tanggal', startStr).eq('status', 'selesai');

    const { data: permintaanRaw } = await supabase
        .from('permintaan_data').select('created_at, status')
        .gte('created_at', startStr).eq('status', 'selesai');

    const { data: penilaianRaw } = await supabase
        .from('penilaian').select('nilai, created_at')
        .gte('created_at', startStr);

    const { data: presensiRaw } = await supabase
        .from('presensi').select('kekurangan_menit, waktu_masuk')
        .gte('waktu_masuk', startStr).not('waktu_masuk', 'is', null);

    const dataBulanan = bulanList.map((b) => {
        const antrianBulan = (antrianRaw ?? []).filter((a) => a.tanggal.startsWith(b.key)).length;
        const permintaanBulan = (permintaanRaw ?? []).filter((p) => p.created_at.startsWith(b.key)).length;
        const penilaianBulan = (penilaianRaw ?? []).filter((p) => p.created_at.startsWith(b.key));
        const ratingRata = penilaianBulan.length > 0 ? penilaianBulan.reduce((s, p) => s + p.nilai, 0) / penilaianBulan.length : null;
        const presensiBulan = (presensiRaw ?? []).filter((p) => p.waktu_masuk?.startsWith(b.key));
        const tepatWaktuPersen = presensiBulan.length > 0 ? (presensiBulan.filter((p) => p.kekurangan_menit === 0).length / presensiBulan.length) * 100 : null;

        return {
            bulan: b.label,
            offline: antrianBulan,
            online: permintaanBulan,
            total: antrianBulan + permintaanBulan,
            rating: ratingRata !== null ? Number(ratingRata.toFixed(2)) : null,
            tepatWaktu: tepatWaktuPersen !== null ? Number(tepatWaktuPersen.toFixed(0)) : null,
        };
    });

    const totalLayananBulanIni = dataBulanan[dataBulanan.length - 1]?.total ?? 0;
    const totalOfflineSemua = dataBulanan.reduce((s, d) => s + d.offline, 0);
    const totalOnlineSemua = dataBulanan.reduce((s, d) => s + d.online, 0);
    const ratingKeseluruhan = (() => {
        const semuaPenilaian = penilaianRaw ?? [];
        return semuaPenilaian.length > 0 ? (semuaPenilaian.reduce((s, p) => s + p.nilai, 0) / semuaPenilaian.length).toFixed(1) : '—';
    })();

    return (
        <>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-navy-950">Statistik & Tren Layanan</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Ringkasan 6 bulan terakhir — diperbarui otomatis</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-navy-700/10 text-navy-700 flex items-center justify-center shrink-0"><Ticket className="w-5 h-5" /></div>
                        <div>
                            <div className="font-mono text-xl font-semibold text-navy-950 tabular">{totalOfflineSemua}</div>
                            <div className="text-xs text-navy-950/50">Layanan Offline (6 bln)</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center shrink-0"><Globe className="w-5 h-5" /></div>
                        <div>
                            <div className="font-mono text-xl font-semibold text-navy-950 tabular">{totalOnlineSemua}</div>
                            <div className="text-xs text-navy-950/50">Layanan Online (6 bln)</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0"><Star className="w-5 h-5" /></div>
                        <div>
                            <div className="font-mono text-xl font-semibold text-navy-950 tabular">{ratingKeseluruhan}</div>
                            <div className="text-xs text-navy-950/50">Rata-rata Penilaian</div>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-azure-500/10 text-azure-500 flex items-center justify-center shrink-0"><Clock3 className="w-5 h-5" /></div>
                        <div>
                            <div className="font-mono text-xl font-semibold text-navy-950 tabular">{totalLayananBulanIni}</div>
                            <div className="text-xs text-navy-950/50">Layanan Bulan Ini</div>
                        </div>
                    </div>
                </Card>
            </div>

            <StatistikCharts data={dataBulanan} />
        </>
    );
}
