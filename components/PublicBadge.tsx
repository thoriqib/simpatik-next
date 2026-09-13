'use client';

import { useTranslations } from 'next-intl';

/**
 * Versi Badge KHUSUS halaman publik ([locale] scope) — menampilkan
 * label status sesuai bahasa aktif (ID/EN). SENGAJA dibuat terpisah
 * dari `components/ui/Badge.tsx` (bukan menambah locale-awareness ke
 * situ), karena:
 *
 * 1. `Badge` asli dipakai LUAS di admin/petugas juga, yang TIDAK berada
 *    di dalam NextIntlClientProvider — memanggil useTranslations()/
 *    useLocale() di sana akan CRASH (next-intl mewajibkan provider).
 * 2. Sesuai keputusan: admin/petugas tetap Bahasa Indonesia saja, cuma
 *    sisi pengunjung/tamu yang multi-bahasa.
 *
 * Styling (warna) identik dengan Badge asli — cuma teks labelnya yang
 * beda sumber (terjemahan, bukan hardcode Indonesia).
 */
const STATUS_STYLE: Record<string, string> = {
    menunggu: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
    dipanggil: 'bg-azure-500/10 text-azure-500 ring-1 ring-azure-500/20',
    dilayani: 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20',
    selesai: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20',
    batal: 'bg-navy-950/5 text-navy-950/40 ring-1 ring-navy-950/10',
    baru: 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20',
    diproses: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20',
    dibatalkan: 'bg-navy-950/5 text-navy-950/40 ring-1 ring-navy-950/10 line-through',
};

export function PublicBadge({ status }: { status: string }) {
    const t = useTranslations('status');
    const className = STATUS_STYLE[status] ?? 'bg-navy-950/5 text-navy-950/50 ring-1 ring-navy-950/10';

    let label: string;
    try {
        label = t(status);
    } catch {
        // Status di luar daftar yang diterjemahkan (harusnya tidak pernah
        // terjadi untuk status yang memang tampil ke publik) — tampilkan
        // apa adanya daripada error, jaga-jaga saja.
        label = status;
    }

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${className}`}>
            {label}
        </span>
    );
}
