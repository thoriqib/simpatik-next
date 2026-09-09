import { JadwalPetugasView } from '@/components/JadwalPetugasView';

// [OPTIMASI PERFORMA] ISR 60 detik, bukan force-dynamic — data jadwal
// jarang berubah, dan setiap aksi admin (tambah/hapus jadwal, hari libur)
// sudah memanggil revalidatePath ke halaman ini, jadi perubahan tetap
// langsung terlihat tanpa perlu menunggu jendela 60 detik.
export const revalidate = 60;

export default async function JadwalPetugasPage({
    searchParams,
}: {
    searchParams: Promise<{ minggu?: string }>;
}) {
    const { minggu } = await searchParams;
    return <JadwalPetugasView minggu={minggu} basePath="/jadwal-petugas" />;
}
