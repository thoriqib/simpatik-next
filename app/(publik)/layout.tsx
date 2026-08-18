import { PublicHeader } from '@/components/layouts/PublicHeader';
import { PublicFooter } from '@/components/layouts/PublicFooter';

export default function PublikLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-paper-50">
            <PublicHeader />
            <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-8">{children}</main>
            <PublicFooter />
        </div>
    );
}
