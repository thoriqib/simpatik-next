import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { RoleTable } from './RoleTable';
import { unstable_noStore as noStore } from 'next/cache';

export const dynamic = 'force-dynamic';

export default async function PengaturanAksesPage() {
    // [FIX BUG] Lihat catatan lengkap di app/petugas/dashboard/page.tsx
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: semuaStaf } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .order('role')
        .order('name');

    return (
        <>
            <div className="mb-5">
                <h1 className="text-lg font-semibold text-navy-950">Pengaturan Akses</h1>
                <p className="text-sm text-navy-950/50 mt-0.5">
                    Kelola role pengguna — jadikan petugas sebagai admin, atau turunkan admin jadi petugas biasa.
                </p>
            </div>
            <Card>
                <RoleTable staf={semuaStaf ?? []} currentUserId={user!.id} />
            </Card>
        </>
    );
}
