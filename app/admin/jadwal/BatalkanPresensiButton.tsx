'use client';

import { useState, useTransition } from 'react';
import { batalkanPresensi } from '@/lib/actions/presensi';
import { ConfirmModal } from '@/components/ui/Modal';
import { RotateCcw } from 'lucide-react';

export function BatalkanPresensiButton({ presensiId, jadwalPiketId }: { presensiId: number; jadwalPiketId: number }) {
    const [confirm, setConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');

    function handleBatalkan() {
        startTransition(async () => {
            const res = await batalkanPresensi(presensiId, jadwalPiketId);
            setConfirm(false);
            if (res?.error) {
                setError(res.error);
                return;
            }
            window.location.reload(); // jamin data presensi terbaru termuat
        });
    }

    return (
        <>
            {error && <span className="text-rose-500 text-xs">{error}</span>}
            <button
                onClick={() => setConfirm(true)}
                disabled={isPending}
                title="Batalkan presensi — hapus catatan masuk/keluar petugas ini"
                className="inline-flex items-center gap-1 text-amber-600 hover:underline text-xs disabled:opacity-50"
            >
                <RotateCcw className="w-3 h-3" /> Batalkan
            </button>

            <ConfirmModal
                open={confirm}
                onClose={() => setConfirm(false)}
                onConfirm={handleBatalkan}
                pending={isPending}
                title="Batalkan Presensi?"
                message="Catatan presensi masuk & keluar petugas ini akan dihapus. Status jadwal kembali ke 'Terjadwal', seolah belum presensi hari ini."
            />
        </>
    );
}
