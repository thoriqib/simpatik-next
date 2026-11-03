import { PublicHeader } from '@/components/layouts/PublicHeader';
import { PublicFooter } from '@/components/layouts/PublicFooter';
import { PublicShell } from '@/components/layouts/PublicShell';

export default async function PublikLayout({
    children,
    params,
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    return (
        <PublicShell
            header={<PublicHeader />}
            footer={<PublicFooter />}
            skipLabel={locale === 'en' ? 'Skip to main content' : 'Lewati ke konten utama'}
        >
            {children}
        </PublicShell>
    );
}
