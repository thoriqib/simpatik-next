import { NextIntlClientProvider } from 'next-intl';
import { setRequestLocale, getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * Layout untuk SELURUH rute yang masuk scope terjemahan (dibungkus
 * NextIntlClientProvider). Rute admin/petugas/login/display-antrian/
 * jadwal-petugas TIDAK berada di bawah [locale] — sama sekali tidak
 * terpengaruh oleh apa pun di file ini.
 */
export function generateStaticParams() {
    return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;

    if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
        notFound();
    }

    // Wajib untuk halaman yang di-generate statis (generateStaticParams
    // di atas) — memberi tahu next-intl locale mana yang aktif di render
    // server ini, tanpa perlu baca ulang dari request setiap kali.
    setRequestLocale(locale);

    // [FIX BUG KRITIS] NextIntlClientProvider WAJIB dikasih `messages`
    // secara eksplisit — tanpa ini, komponen CLIENT ('use client', seperti
    // PublicHeader & LanguageSwitcher) sama sekali tidak punya data
    // terjemahan untuk dipakai, dan useTranslations() di sana akan
    // menampilkan STRING KUNCI MENTAH (mis. "nav.home") apa adanya alih-alih
    // teks terjemahan — komponen SERVER tidak terdampak (mereka ambil
    // langsung dari config request), makanya bug ini gampang terlewat
    // kalau cuma dites di halaman yang isinya full komponen server.
    const messages = await getMessages();

    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            {children}
        </NextIntlClientProvider>
    );
}
