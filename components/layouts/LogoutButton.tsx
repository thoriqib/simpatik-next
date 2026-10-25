'use client';

import { useFormStatus } from 'react-dom';
import { LogOut } from 'lucide-react';
import { Spinner } from '@/components/ui/Spinner';

/** Tombol keluar dengan spinner — dipakai di dalam <form action={logout}>. */
export function LogoutButton() {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-sm text-white/60 hover:text-white disabled:opacity-60 disabled:cursor-wait">
            {pending ? <Spinner /> : <LogOut className="w-4 h-4" strokeWidth={2} />}
            {pending ? 'Keluar...' : 'Keluar'}
        </button>
    );
}
