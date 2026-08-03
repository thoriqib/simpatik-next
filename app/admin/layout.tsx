import { createClient } from '@/lib/supabase/server';
import { AdminSidebar } from '@/components/layouts/AdminSidebar';

// Layout ini otomatis hanya bisa diakses role admin (dijamin middleware.ts).
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from('profiles').select('name').eq('id', user!.id).single();

    return (
        <div>
            <AdminSidebar name={profile?.name ?? 'Admin'} />
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
