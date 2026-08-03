import { PublicHeader } from '@/components/layouts/PublicHeader';

export default function PublikLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <PublicHeader />
            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">{children}</main>
            <footer className="bg-white border-t mt-auto">
                <div className="max-w-2xl mx-auto px-4 py-4 text-center text-sm text-gray-400">
                    © {new Date().getFullYear()} Simpatik — BPS Kota Jambi
                </div>
            </footer>
        </div>
    );
}
