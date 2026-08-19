import { JadwalPetugasView } from '@/components/JadwalPetugasView';

export const dynamic = 'force-dynamic';

export default async function JadwalPetugasPage({
    searchParams,
}: {
    searchParams: Promise<{ minggu?: string }>;
}) {
    const { minggu } = await searchParams;
    return <JadwalPetugasView minggu={minggu} basePath="/jadwal-petugas" />;
}
