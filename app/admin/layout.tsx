import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/layouts/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single();

    return <AdminShell name={profile?.name ?? 'Admin'}>{children}</AdminShell>;
}
