import { JadwalPetugasView } from '@/components/JadwalPetugasView';

export const dynamic = 'force-dynamic';

/**
 * Versi admin dari tampilan jadwal petugas mingguan — sebelumnya menu
 * sidebar admin mengarah langsung ke halaman publik /jadwal-petugas
 * (jadi admin "keluar" dari layout sidebar begitu diklik). Sekarang
 * punya halaman sendiri, tetap di dalam layout admin.
 */
export default async function JadwalPetugasAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ minggu?: string }>;
}) {
    const { minggu } = await searchParams;
    return <JadwalPetugasView minggu={minggu} basePath="/admin/jadwal-petugas" />;
}
