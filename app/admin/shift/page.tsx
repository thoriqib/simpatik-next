import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { ShiftTable } from './ShiftTable';

export const dynamic = 'force-dynamic';

export default async function ShiftPage() {
    const supabase = await createClient();
    const { data: shifts } = await supabase.from('shift_piket').select('*').order('jam_mulai');

    return (
        <>
            <h1 className="text-lg font-semibold text-gray-800 mb-5">Pengaturan Shift Piket</h1>
            <Card>
                <ShiftTable shifts={shifts ?? []} />
            </Card>
        </>
    );
}
