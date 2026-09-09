'use client';

import { useState, useTransition } from 'react';
import { hapusKunjunganMitra } from '@/lib/actions/antrian';
import { ConfirmModal } from '@/components/ui/Modal';

export function HapusKunjunganMitraButton({ id, nama }: { id: number; nama: string }) {
    const [confirm, setConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleHapus() {
        startTransition(async () => {
            await hapusKunjunganMitra(id);
            setConfirm(false);
        });
    }

    return (
        <>
            <button onClick={() => setConfirm(true)} className="text-xs text-rose-500 hover:underline font-medium">Hapus</button>
            <ConfirmModal
                open={confirm}
                onClose={() => setConfirm(false)}
                onConfirm={handleHapus}
                pending={isPending}
                title="Hapus Data Kunjungan?"
                message={`Data kunjungan "${nama}" akan dihapus permanen dan tidak bisa dibatalkan.`}
            />
        </>
    );
}
