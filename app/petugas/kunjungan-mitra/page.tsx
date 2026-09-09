import { KunjunganMitraView } from '@/components/KunjunganMitraView';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function KunjunganMitraPetugasPage({
    searchParams,
}: {
    searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
    noStore();
    const { dari, sampai } = await searchParams;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-xl font-bold text-navy-950 tracking-tight">Kunjungan Mitra Statistik</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Catatan kunjungan mitra kerja sama statistik — tanpa nomor antrian</p>
            </div>
            <KunjunganMitraView dari={dari} sampai={sampai} bisaHapus={false} />
        </>
    );
}
