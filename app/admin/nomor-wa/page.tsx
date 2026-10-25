import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { tampilNomorWa } from '@/lib/nomor-wa';
import { unstable_noStore as noStore } from 'next/cache';
import { NomorWaForm } from './NomorWaForm';

export const dynamic = 'force-dynamic';

export default async function NomorWaPage() {
    noStore();
    const supabase = await createClient();
    const { data } = await supabase.from('profiles').select('id, name, email, no_hp').order('name');

    const baris = (data ?? []).map((p) => ({
        id: p.id as string,
        name: p.name as string,
        email: p.email as string,
        noHp: tampilNomorWa(p.no_hp as string | null),
    }));

    return (
        <>
            <div className="mb-5">
                <h1 className="text-lg font-semibold text-navy-950">Nomor WhatsApp Petugas</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">
                    Dipakai untuk pengingat piket otomatis setiap pagi pukul 07.00 WIB. Kosongkan nomor kalau petugas tidak perlu dikirimi pengingat.
                </p>
            </div>
            <Card>
                <NomorWaForm baris={baris} />
            </Card>
        </>
    );
}
