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
                <h2 className="text-xl font-bold text-gray-800">Kirim Pengaduan</h2>
                <p className="text-sm text-gray-500 mt-1">Pengaduan bersifat anonim. Sampaikan keluhan atau masukan Anda dengan jujur.</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <form action={formAction} className="space-y-4">
                    {state?.error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">{state.error}</div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Subjek Pengaduan <span className="text-red-500">*</span>
                        </label>
                        <input name="subjek" required placeholder="Contoh: Petugas kurang responsif"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Isi Pengaduan <span className="text-red-500">*</span>
                        </label>
                        <textarea name="isi_pengaduan" rows={5} required placeholder="Jelaskan pengaduan Anda secara detail..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 resize-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Lampiran <span className="text-gray-400">(opsional, maks 2MB)</span>
                        </label>
                        <input type="file" name="lampiran" accept=".jpg,.jpeg,.png,.pdf"
                            className="w-full text-sm text-gray-500 border border-gray-300 rounded-lg file:mr-3 file:py-2 file:px-4 file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" />
                    </div>

                    <SubmitButton className="w-full py-3" pendingText="Mengirim...">
                        📢 Kirim Pengaduan
                    </SubmitButton>
                </form>
            </div>

            <div className="mt-4 text-center">
                <Link href="/" className="text-sm text-gray-500 hover:underline">← Kembali ke Halaman Antrian</Link>
            </div>
        </>
    );
}
