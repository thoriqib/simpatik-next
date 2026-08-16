'use client';

import { useState, useTransition } from 'react';
import { ubahUrutanLinkPestaKoja, ubahAktifLinkPestaKoja, hapusLinkPestaKoja } from '@/lib/actions/pesta-koja';
import { ConfirmModal } from '@/components/ui/Modal';
import { ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

export function UrutanButtons({ id, bisaNaik, bisaTurun }: { id: number; bisaNaik: boolean; bisaTurun: boolean }) {
    const [isPending, startTransition] = useTransition();

    function ubah(arah: 'naik' | 'turun') {
        startTransition(async () => {
            await ubahUrutanLinkPestaKoja(id, arah);
            window.location.reload();
        });
    }

    return (
        <div className="flex flex-col gap-0.5">
            <button onClick={() => ubah('naik')} disabled={!bisaNaik || isPending}
                className="p-0.5 text-navy-950/40 hover:text-navy-950 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                <ChevronUp className="w-4 h-4" />
            </button>
            <button onClick={() => ubah('turun')} disabled={!bisaTurun || isPending}
                className="p-0.5 text-navy-950/40 hover:text-navy-950 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                <ChevronDown className="w-4 h-4" />
            </button>
        </div>
    );
}

export function ToggleAktif({ id, isAktif }: { id: number; isAktif: boolean }) {
    const [isPending, startTransition] = useTransition();

    function toggle() {
        startTransition(async () => {
            await ubahAktifLinkPestaKoja(id, !isAktif);
            window.location.reload();
        });
    }

    return (
        <button
            onClick={toggle}
            disabled={isPending}
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 ${
                isAktif ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' : 'bg-navy-950/5 text-navy-950/40 hover:bg-navy-950/10'
            }`}
        >
            {isAktif ? 'Aktif' : 'Nonaktif'}
        </button>
    );
}

export function HapusLinkButton({ id, judul }: { id: number; judul: string }) {
    const [confirm, setConfirm] = useState(false);
    const [isPending, startTransition] = useTransition();

    function handleHapus() {
        startTransition(async () => {
            await hapusLinkPestaKoja(id);
            setConfirm(false);
            window.location.reload();
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
                title="Hapus Link?"
                message={`Link "${judul}" akan dihapus permanen dari Pesta Koja dan tidak bisa dibatalkan.`}
            />
        </>
    );
}
