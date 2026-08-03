import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { JenisLayananTable } from './JenisLayananTable';

export const dynamic = 'force-dynamic';

export default async function JenisLayananPage() {
    const supabase = await createClient();
    const { data: jenisLayanan } = await supabase
        .from('jenis_layanan')
        .select('*, antrian(count)')
        .order('kode');

    const withCount = (jenisLayanan ?? []).map((j) => ({ ...j, total_antrian: j.antrian?.[0]?.count ?? 0 }));

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-5">Jenis Layanan</h1>
            <Card>
                <JenisLayananTable jenisLayanan={withCount} />
            </Card>
        </>
    );
}
