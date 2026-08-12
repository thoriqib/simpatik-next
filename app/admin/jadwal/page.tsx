import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { JadwalForm } from './JadwalForm';
import { CsvImport } from './CsvImport';
import { HariLiburManager } from './HariLiburManager';
import { BatalkanPresensiButton } from './BatalkanPresensiButton';
import { hapusJadwal } from '@/lib/actions/jadwal';
import { getMondayOfWeek, getWeekdayDates, currentWeekMondayWIB, toDateStringLocal, parseDateLocal } from '@/lib/utils';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import type { HariLibur } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

export default async function JadwalPage({ searchParams }: { searchParams: Promise<{ minggu?: string }> }) {
    // [FIX BUG] Lihat catatan lengkap di app/petugas/dashboard/page.tsx —
    // dynamic='force-dynamic' saja tidak cukup menjamin data segar di
    // semua kondisi reload, terutama setelah BatalkanPresensiButton.
    noStore();

    const params = await searchParams;

    // ── Tentukan Senin minggu yang ditampilkan (default: minggu ini WIB) ──
    const monday = params.minggu ? getMondayOfWeek(parseDateLocal(params.minggu)) : currentWeekMondayWIB();
    const hariKerja = getWeekdayDates(monday);
    const start = toDateStringLocal(hariKerja[0]);
    const end = toDateStringLocal(hariKerja[4]);

    const mondayPrev = new Date(monday); mondayPrev.setDate(mondayPrev.getDate() - 7);
    const mondayNext = new Date(monday); mondayNext.setDate(mondayNext.getDate() + 7);
    const isMingguIni = toDateStringLocal(monday) === toDateStringLocal(currentWeekMondayWIB());

    const supabase = await createClient();

    // [FIX] Cast eksplisit — relasi to-one (profiles, shift_piket) ditebak
    // sebagai array tanpa generated types. `presensi` tetap array (memang
    // diakses via presensi?.[0] di JSX, konsisten dengan bentuk aslinya).
    type JadwalRow = {
        id: number;
        tanggal: string;
        status: string;
        profiles: { name: string } | null;
        shift_piket: { nama_shift: string; jam_mulai: string; jam_selesai: string } | null;
        presensi: { id: number; waktu_masuk: string | null; waktu_keluar: string | null }[] | null;
    };

    const { data: jadwalRaw } = await supabase
        .from('jadwal_piket')
        .select('*, profiles(name), shift_piket(*), presensi(id, waktu_masuk, waktu_keluar)')
        .gte('tanggal', start)
        .lte('tanggal', end)
        .order('tanggal');

    const jadwal = jadwalRaw as unknown as JadwalRow[] | null;

    const { data: petugas } = await supabase.from('profiles').select('id, name').eq('role', 'petugas').order('name');
    const { data: shifts } = await supabase.from('shift_piket').select('*').eq('is_aktif', true);

    const { data: hariLiburRaw } = await supabase
        .from('hari_libur')
        .select('*')
        .gte('tanggal', start)
        .lte('tanggal', end)
        .order('tanggal');
    const hariLibur = (hariLiburRaw ?? []) as HariLibur[];

    const rangeLabel = `${hariKerja[0].toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })} – ${hariKerja[4].toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`;

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-5">Jadwal Piket</h1>

            <CsvImport />

            {/* Navigasi minggu */}
            <Card className="mb-5 !p-3">
                <div className="flex items-center justify-between gap-3">
                    <Link
                        href={`/admin/jadwal?minggu=${toDateStringLocal(mondayPrev)}`}
                        className="inline-flex items-center gap-1.5 text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-50 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" /> Minggu Lalu
                    </Link>
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-navy-950 text-sm">{rangeLabel}</span>
                        {!isMingguIni && (
                            <Link href="/admin/jadwal"
                                className="inline-flex items-center gap-1.5 text-xs bg-azure-500/10 text-azure-500 px-3 py-1.5 rounded-lg font-medium hover:bg-azure-500/20 transition-colors">
                                <CalendarClock className="w-3.5 h-3.5" /> Minggu Ini
                            </Link>
                        )}
                    </div>
                    <Link
                        href={`/admin/jadwal?minggu=${toDateStringLocal(mondayNext)}`}
                        className="inline-flex items-center gap-1.5 text-sm text-navy-950/60 hover:text-navy-950 px-3 py-2 rounded-lg hover:bg-paper-50 transition-colors"
                    >
                        Minggu Depan <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </Card>

            <Card title="Hari Libur Nasional Minggu Ini" description="Tandai tanggal yang libur nasional supaya tampil di jadwal publik & tidak perlu diisi jadwal piket." className="mb-5">
                <HariLiburManager hariKerja={hariKerja.map((d) => toDateStringLocal(d))} hariLibur={hariLibur} />
            </Card>

            <Card title={`Jadwal Piket — ${rangeLabel}`}>
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b text-navy-950/50 text-left">
                            <th className="pb-3 font-medium">Tanggal</th><th className="pb-3 font-medium">Petugas</th>
                            <th className="pb-3 font-medium">Shift</th><th className="pb-3 font-medium">Status</th>
                            <th className="pb-3 font-medium">Masuk</th><th className="pb-3 font-medium">Keluar</th><th className="pb-3 font-medium">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {jadwal && jadwal.length > 0 ? jadwal.map((j) => (
                            <tr key={j.id} className="hover:bg-paper-50">
                                <td className="py-3">{new Date(j.tanggal).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}</td>
                                <td className="py-3 font-medium">{j.profiles?.name}</td>
                                <td className="py-3">{j.shift_piket?.nama_shift} <span className="text-navy-950/30 text-xs">({j.shift_piket?.jam_mulai}–{j.shift_piket?.jam_selesai})</span></td>
                                <td className="py-3"><Badge status={j.status} /></td>
                                <td className="py-3 text-navy-950/60">{j.presensi?.[0]?.waktu_masuk ? new Date(j.presensi[0].waktu_masuk).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-'}</td>
                                <td className="py-3 text-navy-950/60">{j.presensi?.[0]?.waktu_keluar ? new Date(j.presensi[0].waktu_keluar).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) : '-'}</td>
                                <td className="py-3">
                                    <div className="flex items-center gap-2">
                                        {j.presensi?.[0]?.waktu_masuk && (
                                            <BatalkanPresensiButton presensiId={j.presensi[0].id} jadwalPiketId={j.id} />
                                        )}
                                        {/* [FIX] .bind() menghasilkan referensi Server Action yang valid
                                            untuk form di Server Component — closure async inline biasa
                                            (tanpa 'use server' di dalamnya) TIDAK bisa diserialisasi
                                            dan menyebabkan error "Functions cannot be passed directly
                                            to Client Components". */}
                                        <form action={hapusJadwal.bind(null, j.id)}>
                                            <button type="submit" className="text-red-500 hover:underline text-xs">Hapus</button>
                                        </form>
                                    </div>
                                </td>
                            </tr>
                        )) : <tr><td colSpan={7} className="py-8 text-center text-navy-950/30">Belum ada jadwal untuk minggu ini</td></tr>}
                    </tbody>
                </table>
                </div>
            </Card>

            <Card title="Tambah Jadwal Piket Manual" className="mt-5">
                <JadwalForm petugas={petugas ?? []} shifts={shifts ?? []} />
            </Card>
        </>
    );
}
