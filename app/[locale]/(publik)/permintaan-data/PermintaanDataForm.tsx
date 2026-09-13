'use client';

import { useActionState } from 'react';
import { kirimPermintaanData } from '@/lib/actions/permintaan-data';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { useTranslations } from 'next-intl';
import { Send, Briefcase, GraduationCap, Check } from 'lucide-react';

export function PermintaanDataForm() {
    const [state, formAction] = useActionState(kirimPermintaanData, null);
    const t = useTranslations('permintaanData.form');

    const KEGUNAAN_OPTIONS = [
        { value: 'kedinasan', label: t('kedinasan'), icon: Briefcase, peer: 'peer-checked:border-azure-500 peer-checked:bg-azure-500/10 peer-checked:ring-2 peer-checked:ring-azure-500' },
        { value: 'pribadi', label: t('pribadi'), icon: GraduationCap, peer: 'peer-checked:border-emerald-600 peer-checked:bg-emerald-600/10 peer-checked:ring-2 peer-checked:ring-emerald-600' },
    ];

    return (
        <form action={formAction} className="space-y-4 relative">
            {state?.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{state.error}</div>
            )}

            {/* Honeypot anti-bot — tersembunyi dari manusia (lewat CSS, bukan
                type="hidden" yang gampang dideteksi bot canggih), field ini
                harus TETAP KOSONG. Bot pengisi form otomatis biasanya isi
                semua field yang ada di DOM, termasuk yang tersembunyi begini. */}
            <div className="absolute -left-[9999px] w-px h-px overflow-hidden" aria-hidden="true">
                <label htmlFor="website">{t('honeypotLabel')}</label>
                <input type="text" id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    {t('namaLengkap')} <span className="text-rose-500">*</span>
                </label>
                <input name="nama_lengkap" required maxLength={150}
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    {t('instansi')} <span className="text-rose-500">*</span>
                </label>
                <input name="instansi" required maxLength={150} placeholder={t('instansiPlaceholder')}
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-2">
                    {t('kegunaanData')} <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2.5">
                    {KEGUNAAN_OPTIONS.map((opt) => {
                        const Icon = opt.icon;
                        return (
                            <label key={opt.value} className="relative block cursor-pointer">
                                <input type="radio" name="kegunaan_data" value={opt.value} required className="peer sr-only" />
                                <div className={`flex items-center gap-3 border-2 border-paper-200 bg-white rounded-xl px-4 py-3 transition-all ${opt.peer}`}>
                                    <Icon className="w-4 h-4 text-navy-950/40 shrink-0" strokeWidth={2} />
                                    <span className="flex-1 text-sm text-navy-950">{opt.label}</span>
                                    <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity bg-navy-700">
                                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                                    </div>
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">
                        {t('email')} <span className="text-rose-500">*</span>
                    </label>
                    <input name="email" type="email" required maxLength={150}
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">
                        {t('noHp')} <span className="text-rose-500">*</span>
                    </label>
                    <input name="no_hp" type="tel" required maxLength={20} placeholder="08xxxxxxxxxx"
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    {t('kebutuhan')} <span className="text-rose-500">*</span>
                </label>
                <textarea name="kebutuhan_data" required maxLength={2000} rows={5}
                    placeholder={t('kebutuhanPlaceholder')}
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <SubmitButton className="w-full py-3.5 text-base mt-2" pendingText={t('submitting')}>
                <Send className="w-4 h-4" />
                {t('submit')}
            </SubmitButton>
        </form>
    );
}
