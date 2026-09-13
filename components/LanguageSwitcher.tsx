'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

/**
 * Toggle ID/EN — pakai router/pathname locale-aware dari i18n/navigation
 * (bukan next/navigation biasa), supaya otomatis pindah ke versi
 * terjemahan halaman yang SEDANG dibuka (bukan selalu balik ke beranda).
 *
 * [FIX BUG] `variant` menentukan skema warna — sebelumnya di-hardcode
 * untuk latar gelap (putih transparan), sampai tidak terlihat sama
 * sekali dipasang di header landing page yang latarnya TERANG
 * (bg-paper-50). `dark` (default) = dipakai di PublicHeader (bg-navy-950),
 * `light` = dipakai di landing page (bg-paper-50).
 */
export function LanguageSwitcher({ variant = 'dark' }: { variant?: 'dark' | 'light' }) {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const t = useTranslations('languageSwitcher');
    const [isPending, startTransition] = useTransition();

    function gantiBahasa(localeBaru: string) {
        startTransition(() => {
            router.replace(pathname, { locale: localeBaru });
        });
    }

    const warna = variant === 'light'
        ? {
            icon: 'text-navy-950/40',
            aktif: 'bg-navy-950/10 text-navy-950',
            nonaktif: 'text-navy-950/40 hover:text-navy-950/70',
        }
        : {
            icon: 'text-white/40',
            aktif: 'bg-white/15 text-white',
            nonaktif: 'text-white/40 hover:text-white/70',
        };

    return (
        <div className="flex items-center gap-1" aria-label={t('label')}>
            <Globe className={`w-3.5 h-3.5 mr-0.5 ${warna.icon}`} />
            <button
                onClick={() => gantiBahasa('id')}
                disabled={isPending}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                    locale === 'id' ? warna.aktif : warna.nonaktif
                }`}
            >
                ID
            </button>
            <button
                onClick={() => gantiBahasa('en')}
                disabled={isPending}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                    locale === 'en' ? warna.aktif : warna.nonaktif
                }`}
            >
                EN
            </button>
        </div>
    );
}
