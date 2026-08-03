import { createClient } from '@/lib/supabase/server';
import { PetugasShell } from '@/components/layouts/PetugasShell';

export default async function PetugasLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single();

    return <PetugasShell name={profile?.name ?? 'Petugas'}>{children}</PetugasShell>;
}
