'use client';

import { useState } from 'react';
import { Menu } from 'lucide-react';
import { useBadgeAdmin } from './useBadgeAdmin';
import type { BadgeAdmin } from '@/lib/actions/badge-admin';
import { NotifBadge } from './NotifBadge';
import { AdminSidebar } from './AdminSidebar';

export function AdminShell({ name, badgeAwal, children }: { name: string; badgeAwal: BadgeAdmin; children: React.ReactNode }) {
    const [mobileOpen, setMobileOpen] = useState(false);
    const badge = useBadgeAdmin(badgeAwal);
    const total = badge.permintaanBaru + badge.gantiJadwal;

    return (
        <div className="min-h-screen bg-paper-50">
            <AdminSidebar name={name} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} permintaanBaru={badge.permintaanBaru} gantiJadwal={badge.gantiJadwal} />

            <div className="lg:ml-64 min-h-screen flex flex-col">
                <header className="bg-white/80 backdrop-blur-sm border-b border-paper-200 px-4 sm:px-8 py-4 flex items-center justify-between sticky top-0 z-20">
                    <button onClick={() => setMobileOpen(true)} className="lg:hidden relative text-navy-950/60 hover:text-navy-950 p-1 -ml-1">
                        <Menu className="w-5 h-5" />
                        {total > 0 && <NotifBadge count={total} ringClass="ring-white" className="absolute -top-1.5 -right-2 !min-w-[18px] !h-[18px] !text-[10px]" />}
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
