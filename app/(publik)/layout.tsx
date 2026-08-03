import { PublicHeader } from '@/components/layouts/PublicHeader';

export default function PublikLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-paper-50">
            <PublicHeader />
            <main className="flex-1 max-w-2xl mx-auto w-full px-5 py-8">{children}</main>
            <footer className="border-t border-paper-200 mt-auto">
                <div className="max-w-2xl mx-auto px-5 py-5 text-center text-xs text-navy-950/40">
                    © {new Date().getFullYear()} Simpatik — BPS Kota Jambi
                </div>
            </footer>
        </div>
    );
}
