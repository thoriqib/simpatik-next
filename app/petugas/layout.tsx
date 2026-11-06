import { createClient } from '@/lib/supabase/server';
import { PetugasShell } from '@/components/layouts/PetugasShell';

export default async function PetugasLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name, role').eq('id', user!.id).single();

    // [FITUR BARU] Admin bisa merangkap petugas — kalau yang login admin,
    // PetugasSidebar menampilkan tautan "Kembali ke Admin" supaya mudah
    // beralih balik, tanpa perlu logout/login ulang.
    const { count: permintaanBaru } = await supabase.from('permintaan_data').select('id', { count: 'exact', head: true }).eq('status', 'baru');

    return <PetugasShell name={profile?.name ?? 'Petugas'} isAdmin={profile?.role === 'admin'} permintaanBaru={permintaanBaru ?? 0}>{children}</PetugasShell>;
}
