import { createClient } from '@/lib/supabase/server';
import { PetugasShell } from '@/components/layouts/PetugasShell';

export default async function PetugasLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name, role').eq('id', user!.id).single();

    // [FITUR BARU] Admin bisa merangkap petugas — kalau yang login admin,
    // PetugasSidebar menampilkan tautan "Kembali ke Admin" supaya mudah
    // beralih balik, tanpa perlu logout/login ulang.
    return <PetugasShell name={profile?.name ?? 'Petugas'} isAdmin={profile?.role === 'admin'}>{children}</PetugasShell>;
}
