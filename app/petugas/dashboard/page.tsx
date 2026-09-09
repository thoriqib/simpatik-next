import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { todayDateStringWIB } from '@/lib/utils';
import { PresensiPanel } from './PresensiPanel';
import { AntrianPanel } from './AntrianPanel';
import { AntrianSelesaiPanel } from './AntrianSelesaiPanel';
import { Ticket, Globe, Star, Clock3 } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import type { Antrian } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function PetugasDashboard() {
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const today = todayDateStringWIB();

    const now = new Date();
    const kuartal = Math.floor(now.getMonth() / 3);
    const startTriwulan = new Date(now.getFullYear(), kuartal * 3, 1);
    const endTriwulan = new Date(now.getFullYear(), kuartal * 3 + 3, 0);
    const startStr = startTriwulan.toISOString().slice(0, 10);
    const endStr = endTriwulan.toISOString().slice(0, 10);

    // [OPTIMASI PERFORMA] 9 query di bawah ini sepenuhnya independen satu
    // sama lain (tidak ada yang butuh hasil query lain) — sebelumnya
    // dijalankan berurutan (12 query total, satu-satu menunggu selesai),
    // sekarang dijalankan BERSAMAAN lewat Promise.all. Latensi total jadi
    // setara waktu query PALING LAMBAT di antara sembilan ini, bukan lagi
    // akumulasi dari semuanya dijumlahkan.
    const [
        { data: jadwalHariIni },
        { data: antrianAktifRaw },
        { data: antrianSelesaiRaw },
        { count: antrianSaya },
        { count: offlineTriwulan },
        { count: onlineTriwulan },
        { data: jadwalTriwulan },
        { data: antrianSayaTriwulan },
        { data: penilaianOnline },
    ] = await Promise.all([
        // [RANCANG ULANG] Server cuma perlu tahu APAKAH ada jadwal piket
        // hari ini + info shift (data yang jarang berubah, aman dirender
        // server). Status presensi (yang sering berubah & sebelumnya jadi
        // sumber bug) sekarang diambil sendiri oleh PresensiPanel langsung
        // dari browser — lihat komentar lengkap di PresensiPanel.tsx.
        supabase.from('jadwal_piket').select('id, shift_piket(nama_shift, jam_mulai, jam_selesai)').eq('user_id', user!.id).eq('tanggal', today).maybeSingle(),
        supabase.from('antrian').select('*, jenis_layanan(*)').eq('tanggal', today).in('status', ['menunggu', 'dipanggil', 'dilayani']).order('nomor_urut'),
        // [FITUR BARU + FIX BUG] Antrian selesai hari ini — query terpisah,
        // karena antrian aktif di atas SENGAJA cuma ambil status aktif
        // (menunggu/dipanggil/dilayani), jadi tidak akan pernah ketemu baris
        // 'selesai' di dalamnya. Sebelumnya kartu "Selesai Hari Ini" salah
        // hitung (selalu 0) karena difilter dari data yang memang sudah
        // tidak menyertakan status ini sejak awal.
        supabase.from('antrian').select('*, jenis_layanan(*)').eq('tanggal', today).eq('status', 'selesai').order('waktu_selesai', { ascending: false }),
        supabase.from('antrian').select('*', { count: 'exact', head: true }).eq('petugas_id', user!.id).eq('tanggal', today),
        // ── Statistik personal triwulan berjalan — volume, rating,
        // ketepatan presensi. Query terpisah lalu digabung di JS (bukan
        // embed), pola yang sama seperti perhitungan Petugas Terbaik di
        // sisi admin. ──────────────────────────────────────────────────
        supabase.from('antrian').select('*', { count: 'exact', head: true }).eq('petugas_id', user!.id).eq('status', 'selesai').gte('tanggal', startStr).lte('tanggal', endStr),
        supabase.from('permintaan_data').select('*', { count: 'exact', head: true }).eq('ditangani_oleh', user!.id).eq('status', 'selesai').gte('created_at', startStr).lte('created_at', endStr),
        supabase.from('jadwal_piket').select('id').eq('user_id', user!.id).gte('tanggal', startStr).lte('tanggal', endStr),
        // [FIX] Hindari embedded select (`antrian!inner(tanggal)`) — pola
        // ini terbukti tidak reliable di beberapa kasus sebelumnya (lihat
        // catatan di app/petugas/dashboard/PresensiPanel.tsx). Ambil dulu
        // antrian_id milik saya di triwulan ini, baru cari penilaian untuk
        // id-id itu (di gelombang kedua, karena butuh hasil ini).
        supabase.from('antrian').select('id').eq('petugas_id', user!.id).eq('status', 'selesai').gte('tanggal', startStr).lte('tanggal', endStr),
        supabase.from('penilaian').select('nilai').eq('petugas_id', user!.id).not('permintaan_data_id', 'is', null).gte('created_at', startStr).lte('created_at', endStr),
    ]);

    const shiftInfo = (jadwalHariIni?.shift_piket ?? null) as unknown as { nama_shift: string; jam_mulai: string; jam_selesai: string } | null;
    const antrianAktif = antrianAktifRaw as unknown as Antrian[] | null;
    const antrianSelesai = (antrianSelesaiRaw ?? []) as unknown as Antrian[];
    const menunggu = antrianAktif?.filter((a) => a.status === 'menunggu').length ?? 0;
    const selesai = antrianSelesai.length;

    // ── Gelombang kedua — 2 query ini BUTUH hasil dari gelombang pertama
    // (jadwalIdsTriwulan, antrianIdsTriwulan), jadi wajib menunggu Promise.all
    // di atas selesai dulu. Tapi keduanya independen SATU SAMA LAIN, jadi
    // tetap dijalankan bersamaan lewat Promise.all lagi, bukan berurutan. ──
    const jadwalIdsTriwulan = (jadwalTriwulan ?? []).map((j) => j.id);
    const antrianIdsTriwulan = (antrianSayaTriwulan ?? []).map((a) => a.id);

    const [
        { data: presensiTriwulan },
        { data: penilaianOffline },
    ] = await Promise.all([
        supabase.from('presensi').select('kekurangan_menit').in('jadwal_piket_id', jadwalIdsTriwulan.length > 0 ? jadwalIdsTriwulan : [-1]).not('waktu_masuk', 'is', null).not('waktu_keluar', 'is', null),
        supabase.from('penilaian').select('nilai').in('antrian_id', antrianIdsTriwulan.length > 0 ? antrianIdsTriwulan : [-1]),
    ]);

    const tepatWaktuPersen = presensiTriwulan && presensiTriwulan.length > 0
        ? Math.round((presensiTriwulan.filter((p) => p.kekurangan_menit === 0).length / presensiTriwulan.length) * 100)
        : null;

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

            <div className="mt-5">
                <AntrianSelesaiPanel antrianSelesai={antrianSelesai} />
            </div>

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

