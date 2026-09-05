import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { todayDateStringWIB } from '@/lib/utils';
import { PresensiPanel } from './PresensiPanel';
import { AntrianPanel } from './AntrianPanel';
import { Ticket, Globe, Star, Clock3 } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import type { Antrian } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function PetugasDashboard() {
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const today = todayDateStringWIB();

    // [RANCANG ULANG] Server cuma perlu tahu APAKAH ada jadwal piket hari
    // ini + info shift (data yang jarang berubah, aman dirender server).
    // Status presensi (yang sering berubah & sebelumnya jadi sumber bug)
    // sekarang diambil sendiri oleh PresensiPanel langsung dari browser —
    // lihat komentar lengkap di PresensiPanel.tsx.
    const { data: jadwalHariIni } = await supabase
        .from('jadwal_piket')
        .select('id, shift_piket(nama_shift, jam_mulai, jam_selesai)')
        .eq('user_id', user!.id)
        .eq('tanggal', today)
        .maybeSingle();

    const shiftInfo = (jadwalHariIni?.shift_piket ?? null) as unknown as { nama_shift: string; jam_mulai: string; jam_selesai: string } | null;

    const { data: antrianAktifRaw } = await supabase
        .from('antrian')
        .select('*, jenis_layanan(*)')
        .eq('tanggal', today)
        .in('status', ['menunggu', 'dipanggil', 'dilayani'])
        .order('nomor_urut');

    const antrianAktif = antrianAktifRaw as unknown as Antrian[] | null;

    const { count: antrianSaya } = await supabase
        .from('antrian').select('*', { count: 'exact', head: true })
        .eq('petugas_id', user!.id).eq('tanggal', today);

    const menunggu = antrianAktif?.filter((a) => a.status === 'menunggu').length ?? 0;
    const selesai = antrianAktif?.filter((a) => a.status === 'selesai').length ?? 0;

    // ── Statistik personal triwulan berjalan — volume, rating, ketepatan
    // presensi. Query terpisah lalu digabung di JS (bukan embed), pola
    // yang sama seperti perhitungan Petugas Terbaik di sisi admin. ──────
    const now = new Date();
    const kuartal = Math.floor(now.getMonth() / 3);
    const startTriwulan = new Date(now.getFullYear(), kuartal * 3, 1);
    const endTriwulan = new Date(now.getFullYear(), kuartal * 3 + 3, 0);
    const startStr = startTriwulan.toISOString().slice(0, 10);
    const endStr = endTriwulan.toISOString().slice(0, 10);

    const { count: offlineTriwulan } = await supabase
        .from('antrian').select('*', { count: 'exact', head: true })
        .eq('petugas_id', user!.id).eq('status', 'selesai')
        .gte('tanggal', startStr).lte('tanggal', endStr);

    const { count: onlineTriwulan } = await supabase
        .from('permintaan_data').select('*', { count: 'exact', head: true })
        .eq('ditangani_oleh', user!.id).eq('status', 'selesai')
        .gte('created_at', startStr).lte('created_at', endStr);

    const { data: jadwalTriwulan } = await supabase
        .from('jadwal_piket').select('id')
        .eq('user_id', user!.id).gte('tanggal', startStr).lte('tanggal', endStr);
    const jadwalIdsTriwulan = (jadwalTriwulan ?? []).map((j) => j.id);

    const { data: presensiTriwulan } = await supabase
        .from('presensi').select('kekurangan_menit')
        .in('jadwal_piket_id', jadwalIdsTriwulan.length > 0 ? jadwalIdsTriwulan : [-1])
        .not('waktu_masuk', 'is', null).not('waktu_keluar', 'is', null);

    const tepatWaktuPersen = presensiTriwulan && presensiTriwulan.length > 0
        ? Math.round((presensiTriwulan.filter((p) => p.kekurangan_menit === 0).length / presensiTriwulan.length) * 100)
        : null;

    // [FIX] Hindari embedded select (`antrian!inner(tanggal)`) — pola ini
    // terbukti tidak reliable di beberapa kasus sebelumnya (lihat catatan
    // di app/petugas/dashboard/PresensiPanel.tsx). Ambil dulu antrian_id
    // milik saya di triwulan ini, baru cari penilaian untuk id-id itu.
    const { data: antrianSayaTriwulan } = await supabase
        .from('antrian').select('id')
        .eq('petugas_id', user!.id).eq('status', 'selesai')
        .gte('tanggal', startStr).lte('tanggal', endStr);
    const antrianIdsTriwulan = (antrianSayaTriwulan ?? []).map((a) => a.id);

    const { data: penilaianOffline } = await supabase
        .from('penilaian').select('nilai')
        .in('antrian_id', antrianIdsTriwulan.length > 0 ? antrianIdsTriwulan : [-1]);
    const { data: penilaianOnline } = await supabase
        .from('penilaian').select('nilai')
        .eq('petugas_id', user!.id).not('permintaan_data_id', 'is', null)
        .gte('created_at', startStr).lte('created_at', endStr);

    const semuaPenilaianSaya = [...(penilaianOffline ?? []), ...(penilaianOnline ?? [])];
    const ratingSaya = semuaPenilaianSaya.length > 0
        ? (semuaPenilaianSaya.reduce((s, p) => s + p.nilai, 0) / semuaPenilaianSaya.length).toFixed(1)
        : null;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Dashboard</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Presensi & antrian pelayanan hari ini</p>
            </div>

            <PresensiPanel jadwalPiketId={jadwalHariIni?.id ?? null} shiftInfo={shiftInfo} userId={user!.id} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-5 mb-5">
                <Card className="!p-5 text-center">
                    <div className="font-mono text-3xl font-semibold text-navy-700 tabular">{antrianSaya ?? 0}</div>
                    <div className="text-xs text-navy-950/50 mt-1">Antrian Saya Hari Ini</div>
                </Card>
                <Card className="!p-5 text-center">
                    <div className="font-mono text-3xl font-semibold text-amber-500 tabular">{menunggu}</div>
                    <div className="text-xs text-navy-950/50 mt-1">Antrian Menunggu</div>
                </Card>
                <Card className="!p-5 text-center col-span-2 sm:col-span-1">
                    <div className="font-mono text-3xl font-semibold text-emerald-600 tabular">{selesai}</div>
                    <div className="text-xs text-navy-950/50 mt-1">Selesai Hari Ini</div>
                </Card>
            </div>

            <AntrianPanel antrianAktif={antrianAktif ?? []} petugasId={user!.id} />

            <Card title="Statistik Saya" description="Ringkasan performa Anda pada triwulan berjalan" className="mt-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="w-9 h-9 rounded-lg bg-navy-700/10 text-navy-700 flex items-center justify-center mx-auto mb-2"><Ticket className="w-4 h-4" /></div>
                        <div className="font-mono text-xl font-semibold text-navy-950 tabular">{offlineTriwulan ?? 0}</div>
                        <div className="text-xs text-navy-950/50 mt-0.5">Layanan Offline</div>
                    </div>
                    <div className="text-center">
                        <div className="w-9 h-9 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center mx-auto mb-2"><Globe className="w-4 h-4" /></div>
                        <div className="font-mono text-xl font-semibold text-navy-950 tabular">{onlineTriwulan ?? 0}</div>
                        <div className="text-xs text-navy-950/50 mt-0.5">Layanan Online</div>
                    </div>
                    <div className="text-center">
                        <div className="w-9 h-9 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-2"><Star className="w-4 h-4" /></div>
                        <div className="font-mono text-xl font-semibold text-navy-950 tabular">{ratingSaya ?? '—'}</div>
                        <div className="text-xs text-navy-950/50 mt-0.5">Rata-rata Penilaian</div>
                    </div>
                    <div className="text-center">
                        <div className="w-9 h-9 rounded-lg bg-azure-500/10 text-azure-500 flex items-center justify-center mx-auto mb-2"><Clock3 className="w-4 h-4" /></div>
                        <div className="font-mono text-xl font-semibold text-navy-950 tabular">{tepatWaktuPersen !== null ? `${tepatWaktuPersen}%` : '—'}</div>
                        <div className="text-xs text-navy-950/50 mt-0.5">Presensi Tepat Waktu</div>
                    </div>
                </div>
            </Card>
        </>
    );
}

