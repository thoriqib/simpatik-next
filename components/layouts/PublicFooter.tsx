import { Globe, Mail, Instagram, Facebook, Video, MessageCircle, Youtube } from 'lucide-react';

const SOSMED = [
    { icon: Instagram, href: 'https://www.instagram.com/bps.kotajambi/', label: 'Instagram' },
    { icon: Facebook, href: 'https://www.facebook.com/profile.php?id=100069372032427#', label: 'Facebook' },
    { icon: Video, href: 'https://www.tiktok.com/@bps.kotajambi', label: 'TikTok' },
    { icon: MessageCircle, href: 'https://wa.me/6282188880571', label: 'WhatsApp' },
    { icon: Youtube, href: 'https://www.youtube.com/@bpskotajambi9179', label: 'Youtube' },
];

export function PublicFooter() {
    return (
        <footer className="bg-navy-950 text-white mt-auto">
            <div className="max-w-2xl mx-auto px-5 py-8">
                <div className="flex items-center gap-3 mb-6">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/logo/logo-bps.webp" alt="Logo Badan Pusat Statistik" className="w-10 h-auto shrink-0" />
                    <div>
                        <div className="font-bold text-sm">BPS Kota Jambi</div>
                        <div className="text-white/40 text-xs">Badan Pusat Statistik Kota Jambi</div>
                    </div>
                </div>

                <div className="space-y-2 text-sm text-white/60 mb-6">
                    <a href="https://jambikota.bps.go.id/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors w-fit">
                        <Globe className="w-4 h-4 shrink-0" /> jambikota.bps.go.id
                    </a>
                    <a href="mailto:bps1571@bps.go.id" className="flex items-center gap-2 hover:text-white transition-colors w-fit">
                        <Mail className="w-4 h-4 shrink-0" /> bps1571@bps.go.id
                    </a>
                </div>

                <div className="flex gap-2 mb-6 flex-wrap">
                    {SOSMED.map((s) => (
                        <a
                            key={s.label}
                            href={s.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={s.label}
                            aria-label={s.label}
                            className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            <s.icon className="w-4 h-4" />
                        </a>
                    ))}
                </div>

                <div className="border-t border-white/10 pt-5 text-center text-xs text-white/30">
                    © {new Date().getFullYear()} Simpatik — BPS Kota Jambi
                </div>
            </div>
        </footer>
    );
}
