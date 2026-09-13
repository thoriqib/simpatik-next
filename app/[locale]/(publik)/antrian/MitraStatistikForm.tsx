'use client';

import { useActionState } from 'react';
import { catatKunjunganMitra } from '@/lib/actions/antrian';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { useTranslations } from 'next-intl';
import { ClipboardCheck } from 'lucide-react';

/**
 * Form kunjungan Mitra Statistik — TIDAK menghasilkan nomor antrian.
 * Hanya catat nama, no HP, keperluan. Redirect ke ?mitra=sukses (pesan
 * konfirmasi sederhana, bukan halaman tiket seperti antrian biasa).
 */
export function MitraStatistikForm() {
    const [state, formAction] = useActionState(catatKunjunganMitra, null);
    const t = useTranslations('antrian.mitraForm');

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">{state.error}</div>
            )}

            <div className="bg-azure-500/10 border border-blue-200 text-navy-700 rounded-xl px-4 py-3 text-xs leading-relaxed">
                {t('notice')}
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    {t('namaLengkap')} <span className="text-rose-500">*</span>
                </label>
                <input name="nama" required
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    {t('noHp')} <span className="text-rose-500">*</span>
                </label>
                <input name="no_hp" type="tel" required
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">
                    {t('keperluan')} <span className="text-rose-500">*</span>
                </label>
                <textarea name="keperluan" required rows={3} maxLength={500}
                    placeholder={t('keperluanPlaceholder')}
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500 transition-colors" />
            </div>

            <SubmitButton className="w-full py-3.5 text-base mt-2" pendingText={t('submitting')}>
                <ClipboardCheck className="w-4 h-4" />
                {t('submit')}
            </SubmitButton>
        </form>
    );
}
