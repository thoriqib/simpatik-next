'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Lencana angka merah ala notifikasi Facebook/Instagram.
 * - Tampil hanya bila count > 0; di atas 99 ditulis "99+".
 * - "Pop" singkat + cincin berdenyut saat angka bertambah (ada permintaan baru masuk).
 * - Cincin tepi mengikuti warna latar sidebar (navy) agar terlihat menempel rapi.
 */
export function NotifBadge({ count, className = '', ringClass = 'ring-navy-950' }: { count: number; className?: string; ringClass?: string }) {
    const sebelumnya = useRef(count);
    const [pop, setPop] = useState(false);

    useEffect(() => {
        if (count > sebelumnya.current) {
            setPop(true);
            const t = setTimeout(() => setPop(false), 900);
            sebelumnya.current = count;
            return () => clearTimeout(t);
        }
        sebelumnya.current = count;
    }, [count]);

    if (count <= 0) return null;
    const teks = count > 99 ? '99+' : String(count);

    return (
        <span
            role="status"
            aria-label={`${count} permintaan data belum ditangani`}
            title={`${count} permintaan data belum ditangani`}
            className={`relative inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-rose-500 text-white text-[11px] font-bold leading-none tabular shadow-sm ring-2 ${ringClass} ${pop ? 'notif-pop' : ''} ${className}`}
        >
            {pop && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-rose-500 notif-ping" />}
            <span className="relative">{teks}</span>
        </span>
    );
}
