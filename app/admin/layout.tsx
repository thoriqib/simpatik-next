import { createClient } from '@/lib/supabase/server';
import { hitungBadgeAdmin } from '@/lib/actions/badge-admin';
import { AdminShell } from '@/components/layouts/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single();

    const badgeAwal = await hitungBadgeAdmin();

    return <AdminShell name={profile?.name ?? 'Admin'} badgeAwal={badgeAwal}>{children}</AdminShell>;
}
