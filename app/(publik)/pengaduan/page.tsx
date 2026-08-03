'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { kirimPengaduan } from '@/lib/actions/pengaduan';
import { SubmitButton } from '@/components/ui/SubmitButton';

export default function PengaduanPage() {
    const [state, formAction] = useActionState(kirimPengaduan, null);

    return (
        <>
            <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-navy-950">Kirim Pengaduan</h2>
                <p className="text-sm text-navy-950/50 mt-1">Pengaduan bersifat anonim. Sampaikan keluhan atau masukan Anda dengan jujur.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-paper-200 p-6">
                <form action={formAction} className="space-y-4">
                    {state?.error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{state.error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">
                            Subjek Pengaduan <span className="text-red-500">*</span>
                        </label>
                        <input name="subjek" required placeholder="Contoh: Petugas kurang responsif"
                            className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-azure-500/40" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">
                            Isi Pengaduan <span className="text-red-500">*</span>
                        </label>
                        <textarea name="isi_pengaduan" rows={5} required placeholder="Jelaskan pengaduan Anda secara detail..."
                            className="w-full border border-paper-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-azure-500/40 resize-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-navy-950/80 mb-1">
                            Lampiran <span className="text-navy-950/30">(opsional, maks 2MB)</span>
                        </label>
                        <input type="file" name="lampiran" accept=".jpg,.jpeg,.png,.pdf"
                            className="w-full text-sm text-navy-950/50 border border-paper-200 rounded-xl file:mr-3 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-azure-500/10 file:text-navy-700 hover:file:bg-blue-100 cursor-pointer" />
                    </div>

                    <SubmitButton className="w-full py-3" pendingText="Mengirim...">
                        📢 Kirim Pengaduan
                    </SubmitButton>
                </form>
            </div>

            <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-navy-950/50 hover:underline">← Kembali ke Halaman Antrian</Link>
            </div>
        </>
    );
}
