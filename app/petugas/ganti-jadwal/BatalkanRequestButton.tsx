'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, X } from 'lucide-react';
import { ConfirmModal } from '@/components/ui/Modal';
import { batalkanGantiJadwal } from '@/lib/actions/ganti-jadwal';

export function BatalkanRequestButton({ requestId }: { requestId: number }) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState('');
    const [isPending, startTransition] = useTransition();

    function handleBatalkan() {
        setError('');
        startTransition(async () => {
            const res = await batalkanGantiJadwal(requestId);
            if (res.error) { setError(res.error); setOpen(false); return; }
            setOpen(false);
            router.refresh();
        });
    }

    return (
        <>
            {error && <span className="text-rose-500 text-xs mr-2">{error}</span>}
            <button onClick={() => setOpen(true)} disabled={isPending}
                className="inline-flex items-center gap-1 text-rose-600 hover:underline text-xs disabled:opacity-50">
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                {isPending ? 'Membatalkan...' : 'Batalkan request'}
            </button>
            <ConfirmModal open={open} onClose={() => setOpen(false)} onConfirm={handleBatalkan} pending={isPending}
                title="Batalkan Request?" message="Request ganti jadwal ini akan dibatalkan dan jadwal Anda tetap seperti semula."
                confirmText="Ya, Batalkan" pendingText="Membatalkan..." />
        </>
    );
}
