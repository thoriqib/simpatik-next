import { JadwalPetugasView } from '@/components/JadwalPetugasView';

// [OPTIMASI PERFORMA] ISR 60 detik, bukan force-dynamic — data jadwal
// jarang berubah, dan setiap aksi admin (tambah/hapus jadwal, hari libur)
// sudah memanggil revalidatePath ke halaman ini, jadi perubahan tetap
// langsung terlihat tanpa perlu menunggu jendela 60 detik.
export const revalidate = 60;

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
