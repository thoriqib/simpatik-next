'use client';

import { useTransition, type ReactNode } from 'react';
import { Spinner } from '@/components/ui/Spinner';

/**
 * Tombol aksi inline (hapus/aktifkan/dll) yang menampilkan spinner dan
 * menonaktifkan diri selama Server Action berjalan. Menggantikan pola
 * lama `<form action={...}><button>` yang tidak punya indikator apa pun.
 *
 * `action` boleh Server Action yang di-bind dari Server Component
 * (hapusJadwal.bind(null, id)) maupun fungsi biasa dari Client Component.
 * Kalau hasilnya berisi `error`, ditampilkan lewat alert (perilaku lama).
 */
export function InlineActionButton({
    action, children, pendingText = 'Memproses...', className = '', title,
}: {
    action: () => Promise<unknown>;
    children: ReactNode;
    pendingText?: string;
    className?: string;
    title?: string;
}) {
    const [isPending, startTransition] = useTransition();

    function handleClick() {
        startTransition(async () => {
            const res = await action();
            if (res && typeof res === 'object' && 'error' in res && typeof (res as { error: unknown }).error === 'string') {
                alert((res as { error: string }).error);
            }
        });
    }

    return (
        <button type="button" onClick={handleClick} disabled={isPending} title={title}
            className={`inline-flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-wait ${className}`}>
            {isPending && <Spinner className="w-3 h-3" />}
            {isPending ? pendingText : children}
        </button>
    );
}
