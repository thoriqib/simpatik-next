'use client';

import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Globe } from 'lucide-react';

/**
 * Toggle ID/EN — pakai router/pathname locale-aware dari i18n/navigation
 * (bukan next/navigation biasa), supaya otomatis pindah ke versi
 * terjemahan halaman yang SEDANG dibuka (bukan selalu balik ke beranda).
 */
export function LanguageSwitcher() {
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

    return (
        <div className="flex items-center gap-1" aria-label={t('label')}>
            <Globe className="w-3.5 h-3.5 text-white/40 mr-0.5" />
            <button
                onClick={() => gantiBahasa('id')}
                disabled={isPending}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                    locale === 'id' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                }`}
            >
                ID
            </button>
            <button
                onClick={() => gantiBahasa('en')}
                disabled={isPending}
                className={`text-xs px-2 py-1 rounded-md font-medium transition-colors ${
                    locale === 'en' ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white/70'
                }`}
            >
                EN
            </button>
        </div>
    );
}
