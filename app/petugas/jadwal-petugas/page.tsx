import { JadwalPetugasView } from '@/components/JadwalPetugasView';

export const dynamic = 'force-dynamic';

/**
 * Versi petugas dari tampilan jadwal petugas mingguan — masalah yang
 * sama seperti sisi admin: sebelumnya link sidebar mengarah ke halaman
 * publik /jadwal-petugas, jadi petugas "keluar" dari layout sidebar
 * begitu diklik. Sekarang punya halaman sendiri, tetap di dalam layout
 * petugas — konsisten dengan perbaikan yang sama di sisi admin.
 */
export default async function JadwalPetugasPetugasPage({
    searchParams,
}: {
    searchParams: Promise<{ minggu?: string }>;
}) {
    const { minggu } = await searchParams;
    return <JadwalPetugasView minggu={minggu} basePath="/petugas/jadwal-petugas" />;
}
