'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { usePermintaanBaru } from './usePermintaanBaru';
import { NotifBadge } from './NotifBadge';
import { AdminSidebar } from './AdminSidebar';

export function AdminShell({ name, permintaanBaru: awal = 0, children }: { name: string; permintaanBaru?: number; children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const permintaanBaru = usePermintaanBaru(awal);

    return (
        <div className="min-h-screen bg-paper-50">
            <AdminSidebar name={name} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} permintaanBaru={permintaanBaru} />

            <div className="lg:ml-64 min-h-screen flex flex-col">
                <header className="bg-white/80 backdrop-blur-sm border-b border-paper-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
                    <button onClick={() => setMobileOpen(true)} className="lg:hidden relative text-navy-950/60 hover:text-navy-950 p-1 -ml-1">
                        <Menu className="w-5 h-5" />
                        {permintaanBaru > 0 && <NotifBadge count={permintaanBaru} ringClass="ring-white" className="absolute -top-1.5 -right-2 !min-w-[18px] !h-[18px] !text-[10px]" />}
                    </button>
                    <div className="hidden lg:block" />
                    <div className="text-sm text-navy-950/40 tabular">
                        {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                </header>
                <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl w-full">{children}</main>
            </div>
        </div>
    );
}
