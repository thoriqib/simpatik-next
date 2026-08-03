import { createClient } from '@/lib/supabase/server';
import { PetugasSidebar } from '@/components/layouts/PetugasSidebar';

export default async function PetugasLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single();

    return (
        <div>
            <PetugasSidebar name={profile?.name ?? 'Petugas'} />
            <div className="ml-64 min-h-screen flex flex-col">
                <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
                    <div />
                    <div className="text-sm text-gray-500">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </header>
                <main className="flex-1 px-6 pb-8 pt-4">{children}</main>
            </div>
        </div>
    );
}
