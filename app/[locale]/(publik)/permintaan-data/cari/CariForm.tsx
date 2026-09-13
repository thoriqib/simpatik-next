'use client';

import { useState, useTransition } from 'react';
import { Link } from '@/i18n/navigation';
import { cariPermintaanDataPublik } from '@/lib/actions/permintaan-data';
import { PublicBadge as Badge } from '@/components/PublicBadge';
import { useTranslations, useLocale } from 'next-intl';
import { Search, ArrowRight, SearchX } from 'lucide-react';
import type { PermintaanDataRingkasan } from '@/lib/types/database';

export function CariForm() {
    const [isPending, startTransition] = useTransition();
    const [email, setEmail] = useState('');
    const [hasil, setHasil] = useState<PermintaanDataRingkasan[] | null>(null);
    const [error, setError] = useState('');
    const t = useTranslations('permintaanData.cari');
    const tForm = useTranslations('permintaanData.form');
    const locale = useLocale();
    const localeTanggal = locale === 'en' ? 'en-US' : 'id-ID';

    const KEGUNAAN_LABEL: Record<string, string> = {
        kedinasan: tForm('kedinasan'),
        pribadi: tForm('pribadi'),
    };

    function handleCari(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        if (!email.trim()) {
            setError(t('emailRequired'));
            return;
        }
        startTransition(async () => {
            const res = await cariPermintaanDataPublik(email);
            setHasil(res);
        });
    }

    return (
        <div>
            <form onSubmit={handleCari} className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 space-y-4">
                {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{error}</div>}

                <div>
                    <label className="block text-sm font-medium text-navy-950/80 mb-1">
                        {t('emailLabel')}
                    </label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nama@email.com"
                        required
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center gap-2 bg-navy-700 text-white py-3 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50"
                >
                    <Search className="w-4 h-4" />
                    {isPending ? t('searching') : t('submit')}
                </button>
            </form>

            {hasil !== null && (
                <div className="mt-5">
                    {hasil.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-paper-200 p-8 text-center">
                            <SearchX className="w-8 h-8 text-navy-950/20 mx-auto mb-3" />
                            <p className="text-sm text-navy-950/50">
                                {t('notFound')}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-navy-950/40 uppercase tracking-wide">
                                {t('foundCount', { count: hasil.length })}
                            </p>
                            {hasil.map((item) => (
                                <Link
                                    key={item.token}
                                    href={`/permintaan-data/lacak/${item.token}`}
                                    className="group flex items-center gap-3.5 bg-white border border-paper-200 rounded-2xl px-4 py-3.5 shadow-soft hover:shadow-card hover:border-azure-500/30 transition-all"
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium text-navy-700">{KEGUNAAN_LABEL[item.kegunaan_data] ?? item.kegunaan_data}</span>
                                            <Badge status={item.status} />
                                        </div>
                                        <p className="text-sm text-navy-950 truncate">{item.kebutuhan_data}</p>
                                        <p className="text-xs text-navy-950/40 mt-0.5">
                                            {new Date(item.created_at).toLocaleDateString(localeTanggal, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' })} WIB
                                        </p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-navy-950/20 group-hover:text-azure-500 transition-colors shrink-0" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
