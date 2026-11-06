import { createClient } from '@/lib/supabase/server';
import { AdminShell } from '@/components/layouts/AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single();

    const { count: permintaanBaru } = await supabase.from('permintaan_data').select('id', { count: 'exact', head: true }).eq('status', 'baru');

    return <AdminShell name={profile?.name ?? 'Admin'} permintaanBaru={permintaanBaru ?? 0}>{children}</AdminShell>;
}
