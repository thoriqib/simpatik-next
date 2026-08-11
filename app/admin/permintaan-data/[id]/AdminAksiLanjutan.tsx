'use client';

import { useState, useTransition } from 'react';
import { batalkanPermintaanData, hapusPermintaanData } from '@/lib/actions/permintaan-data';
import { ConfirmModal } from '@/components/ui/Modal';
import { Ban, Trash2 } from 'lucide-react';

export function AdminAksiLanjutan({ id, status }: { id: number; status: string }) {
    const [isPending, startTransition] = useTransition();
    const [confirmHapus, setConfirmHapus] = useState(false);
    const [confirmBatal, setConfirmBatal] = useState(false);
    const [error, setError] = useState('');

    function handleHapus() {
        startTransition(async () => {
            const res = await hapusPermintaanData(id); // redirect di server jika sukses
            if (res?.error) setError(res.error);
        });
    }

    function handleBatalkan() {
        startTransition(async () => {
            const res = await batalkanPermintaanData(id);
            if (res?.error) {
                setError(res.error);
                return;
            }
            window.location.reload(); // jamin data status terbaru termuat
        });
    }

    return (
        <div>
            {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm mb-3">{error}</div>}
            <div className="flex flex-wrap gap-2">
                {status !== 'dibatalkan' && (
                    <button
                        onClick={() => setConfirmBatal(true)}
                        disabled={isPending}
                        className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950/70 px-3.5 py-2 rounded-xl text-xs font-medium hover:bg-paper-200 transition-colors disabled:opacity-50"
                    >
                        <Ban className="w-3.5 h-3.5" /> Batalkan Permintaan
                    </button>
                )}
                <button
                    onClick={() => setConfirmHapus(true)}
                    disabled={isPending}
                    className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-600 px-3.5 py-2 rounded-xl text-xs font-medium hover:bg-rose-100 transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus Permanen
                </button>
            </div>

            <ConfirmModal
                open={confirmBatal}
                onClose={() => setConfirmBatal(false)}
                onConfirm={() => { setConfirmBatal(false); handleBatalkan(); }}
                title="Batalkan Permintaan?"
                message="Permintaan akan ditandai 'Dibatalkan'. Data tetap tersimpan untuk arsip, tapi tidak akan dihitung sebagai layanan selesai."
            />
            <ConfirmModal
                open={confirmHapus}
                onClose={() => setConfirmHapus(false)}
                onConfirm={() => { setConfirmHapus(false); handleHapus(); }}
                title="Hapus Permanen?"
                message="Tindakan ini tidak bisa dibatalkan. Seluruh data permintaan ini akan terhapus permanen dari sistem."
                pending={isPending}
            />
        </div>
    );
}
