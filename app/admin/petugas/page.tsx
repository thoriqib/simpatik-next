import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { PetugasTable } from './PetugasTable';

export const dynamic = 'force-dynamic';

export default async function PetugasPage() {
    const supabase = await createClient();

    const { data: petugas } = await supabase
        .from('profiles')
        .select('*, antrian:antrian(count), penilaian:penilaian(nilai)')
        .eq('role', 'petugas')
        .order('name');

    const petugasWithStats = (petugas ?? []).map((p) => {
        const nilaiList = (p.penilaian ?? []).map((n: { nilai: number }) => n.nilai);
        const avgNilai = nilaiList.length ? nilaiList.reduce((a: number, b: number) => a + b, 0) / nilaiList.length : null;
        return {
            ...p,
            antrian_count: p.antrian?.[0]?.count ?? 0,
            avg_nilai: avgNilai,
        };
    });

    return (
        <>
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-lg font-semibold text-navy-950">Data Petugas</h1>
            </div>
            <Card>
                <PetugasTable petugas={petugasWithStats} />
            </Card>
        </>
    );
}
