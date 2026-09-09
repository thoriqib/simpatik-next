import { KunjunganMitraView } from '@/components/KunjunganMitraView';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function KunjunganMitraAdminPage({
    searchParams,
}: {
    searchParams: Promise<{ dari?: string; sampai?: string }>;
}) {
    noStore();
    const { dari, sampai } = await searchParams;

    return (
        <>
            <div className="mb-6">
                <h1 className="text-lg font-semibold text-navy-950">Kunjungan Mitra Statistik</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">Catatan kunjungan mitra kerja sama statistik — tanpa nomor antrian</p>
            </div>
            <KunjunganMitraView dari={dari} sampai={sampai} bisaHapus={true} />
        </>
    );
}
