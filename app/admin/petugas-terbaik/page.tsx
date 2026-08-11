import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Trophy, Clock, Users, Star, Medal } from 'lucide-react';

export const dynamic = 'force-dynamic';

function getKuartalRange(tahun: number, kuartal: number) {
    const startMonth = (kuartal - 1) * 3; // 0, 3, 6, 9
    const start = new Date(tahun, startMonth, 1);
    const end = new Date(tahun, startMonth + 3, 0); // hari terakhir bulan ke-3
    return { start, end };
}

const RANK_STYLE = [
    { bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-500 text-white' },   // 🥇
    { bg: 'bg-paper-100 border-paper-200', badge: 'bg-gray-400 text-white' },   // 🥈
    { bg: 'bg-orange-50 border-orange-100', badge: 'bg-orange-400 text-white' }, // 🥉
];

export default async function PetugasTerbaikPage({
    searchParams,
}: {
    searchParams: Promise<{ tahun?: string; kuartal?: string }>;
}) {
    const params = await searchParams;
    const now = new Date();
    const kuartalSekarang = Math.floor(now.getMonth() / 3) + 1;
    const tahun = Number(params.tahun) || now.getFullYear();
    const kuartal = Number(params.kuartal) || kuartalSekarang;

    const { start, end } = getKuartalRange(tahun, kuartal);
    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const supabase = await createClient();

    const { data: petugasList } = await supabase.from('profiles').select('id, name').eq('role', 'petugas');

    // ── 1. Ketepatan waktu presensi ──────────────────────────────
    type JadwalPresensiRow = {
        user_id: string;
        presensi: { waktu_masuk: string | null; waktu_keluar: string | null; kekurangan_menit: number }[] | null;
    };
    const { data: jadwalRaw } = await supabase
        .from('jadwal_piket')
        .select('user_id, presensi(waktu_masuk, waktu_keluar, kekurangan_menit)')
        .gte('tanggal', startStr).lte('tanggal', endStr);
    const jadwal = jadwalRaw as unknown as JadwalPresensiRow[] | null;

    // ── 2. Jumlah pengunjung dilayani (antrian selesai) ──────────
    type AntrianRow = { petugas_id: string | null };
    const { data: antrianRaw } = await supabase
        .from('antrian')
        .select('petugas_id')
        .eq('status', 'selesai')
        .gte('tanggal', startStr).lte('tanggal', endStr);
    const antrianList = antrianRaw as unknown as AntrianRow[] | null;

    // ── 2b. Permintaan data online yang diselesaikan ──────────────
    // [UPDATE] "Pengunjung dilayani" sekarang juga mencakup permintaan
    // data online yang berhasil diselesaikan petugas, bukan cuma antrian
    // tatap muka — filter berdasar ditanggapi_pada (kapan benar-benar
    // diselesaikan), bukan created_at (kapan pengunjung mengirim form).
    type PermintaanDataRow = { ditangani_oleh: string | null };
    const { data: permintaanDataRaw } = await supabase
        .from('permintaan_data')
        .select('ditangani_oleh')
        .eq('status', 'selesai')
        .gte('ditanggapi_pada', start.toISOString())
        .lte('ditanggapi_pada', end.toISOString());
    const permintaanDataList = permintaanDataRaw as unknown as PermintaanDataRow[] | null;

    // ── 3. Rata-rata penilaian pengunjung ─────────────────────────
    type PenilaianRow = { petugas_id: string; nilai: number; antrian: { tanggal: string } };
    const { data: penilaianRaw } = await supabase
        .from('penilaian')
        .select('petugas_id, nilai, antrian!inner(tanggal)')
        .gte('antrian.tanggal', startStr).lte('antrian.tanggal', endStr);
    const penilaianList = penilaianRaw as unknown as PenilaianRow[] | null;

    // ── Agregasi per petugas ──────────────────────────────────────
    const statsMap = new Map<string, {
        nama: string;
        hariPresensiLengkap: number;
        hariTepatWaktu: number;
        jumlahLayanan: number;
        jumlahOffline: number;
        jumlahOnline: number;
        totalNilai: number;
        jumlahNilai: number;
    }>();

    (petugasList ?? []).forEach((p) => {
        statsMap.set(p.id, { nama: p.name, hariPresensiLengkap: 0, hariTepatWaktu: 0, jumlahLayanan: 0, jumlahOffline: 0, jumlahOnline: 0, totalNilai: 0, jumlahNilai: 0 });
    });

    (jadwal ?? []).forEach((j) => {
        const s = statsMap.get(j.user_id);
        if (!s) return;
        const p = j.presensi?.[0];
        if (p?.waktu_masuk && p?.waktu_keluar) {
            s.hariPresensiLengkap++;
            if (p.kekurangan_menit === 0) s.hariTepatWaktu++;
        }
    });

    (antrianList ?? []).forEach((a) => {
        if (!a.petugas_id) return;
        const s = statsMap.get(a.petugas_id);
        if (s) { s.jumlahLayanan++; s.jumlahOffline++; }
    });

    (permintaanDataList ?? []).forEach((pd) => {
        if (!pd.ditangani_oleh) return;
        const s = statsMap.get(pd.ditangani_oleh);
        if (s) { s.jumlahLayanan++; s.jumlahOnline++; }
    });

    (penilaianList ?? []).forEach((pn) => {
        const s = statsMap.get(pn.petugas_id);
        if (!s) return;
        s.totalNilai += pn.nilai;
        s.jumlahNilai++;
    });

    const maxLayanan = Math.max(1, ...Array.from(statsMap.values()).map((s) => s.jumlahLayanan));

    const ranking = Array.from(statsMap.values())
        .map((s) => {
            const skorPresensi = s.hariPresensiLengkap > 0 ? (s.hariTepatWaktu / s.hariPresensiLengkap) * 100 : 0;
            const skorVolume = (s.jumlahLayanan / maxLayanan) * 100;
            const rataRataNilai = s.jumlahNilai > 0 ? s.totalNilai / s.jumlahNilai : 0;
            const skorRating = (rataRataNilai / 5) * 100;
            const skorTotal = (skorPresensi + skorVolume + skorRating) / 3;
            return { ...s, skorPresensi, skorVolume, rataRataNilai, skorRating, skorTotal };
        })
        // Kecualikan petugas yang sama sekali tidak beraktivitas di triwulan ini
        .filter((r) => r.hariPresensiLengkap > 0 || r.jumlahLayanan > 0 || r.jumlahNilai > 0)
        .sort((a, b) => b.skorTotal - a.skorTotal);

    const kuartalLabel = `Triwulan ${kuartal} ${tahun} (${start.toLocaleDateString('id-ID', { month: 'long' })} – ${end.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })})`;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-amber-500" />
                    Petugas Pelayanan Terbaik
                </h1>
                <p className="text-sm text-navy-950/50 mt-0.5">{kuartalLabel}</p>
            </div>

            <Card className="mb-5">
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Triwulan</label>
                        <select name="kuartal" defaultValue={kuartal} className="border border-paper-200 rounded-xl px-3 py-2 text-sm bg-white">
                            <option value={1}>Triwulan 1 (Jan–Mar)</option>
                            <option value={2}>Triwulan 2 (Apr–Jun)</option>
                            <option value={3}>Triwulan 3 (Jul–Sep)</option>
                            <option value={4}>Triwulan 4 (Okt–Des)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">Tahun</label>
                        <select name="tahun" defaultValue={tahun} className="border border-paper-200 rounded-xl px-3 py-2 text-sm bg-white">
                            {[tahun - 1, tahun, tahun + 1].map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <button type="submit" className="bg-navy-700 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-navy-800 transition-colors">Tampilkan</button>
                </form>
            </Card>

            <Card
                title="Peringkat Petugas"
                description="Skor gabungan dari 3 komponen berbobot sama: ketepatan waktu presensi, jumlah pengunjung dilayani — antrian tatap muka + permintaan data online yang diselesaikan (relatif terhadap petugas dengan volume tertinggi di triwulan ini), dan rata-rata penilaian pengunjung (skala 1–5)."
            >
                {ranking.length > 0 ? (
                    <div className="space-y-3">
                        {ranking.map((r, i) => {
                            const style = RANK_STYLE[i];
                            return (
                                <div key={r.nama} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-2xl border ${style?.bg ?? 'border-paper-200'}`}>
                                    <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold shrink-0 ${style?.badge ?? 'bg-paper-100 text-navy-950/60'}`}>
                                        {i < 3 ? <Medal className="w-5 h-5" /> : <span className="tabular font-mono">{i + 1}</span>}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-navy-950">{r.nama}</div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-navy-950/50 mt-1.5">
                                            <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {r.skorPresensi.toFixed(0)}% tepat waktu</span>
                                            <span className="inline-flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {r.jumlahLayanan} dilayani ({r.jumlahOffline} offline, {r.jumlahOnline} online)</span>
                                            <span className="inline-flex items-center gap-1"><Star className="w-3.5 h-3.5" /> {r.jumlahNilai > 0 ? `${r.rataRataNilai.toFixed(1)}/5.0` : 'Belum ada penilaian'}</span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="font-mono text-2xl font-bold text-navy-950 tabular">{r.skorTotal.toFixed(1)}</div>
                                        <div className="text-[10px] text-navy-950/40 uppercase tracking-widest">Skor</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="py-10 text-center text-navy-950/30 text-sm">Belum ada data aktivitas petugas pada triwulan ini.</div>
                )}
            </Card>
        </>
    );
}
