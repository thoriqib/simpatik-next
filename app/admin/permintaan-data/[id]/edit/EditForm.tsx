'use client';

import { useActionState } from 'react';
import { editPermintaanData } from '@/lib/actions/permintaan-data';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { Check } from 'lucide-react';
import type { PermintaanData } from '@/lib/types/database';

const KEGUNAAN_OPTIONS = [
    { value: 'kedinasan', label: 'Kedinasan/Pekerjaan' },
    { value: 'pribadi', label: 'Pribadi/Tugas Sekolah/Kuliah/Skripsi' },
];

export function EditForm({ permintaan }: { permintaan: PermintaanData }) {
    const action = editPermintaanData.bind(null, permintaan.id);
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{state.error}</div>}

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Nama Lengkap</label>
                <input name="nama_lengkap" defaultValue={permintaan.nama_lengkap} required maxLength={150}
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Instansi</label>
                <input name="instansi" defaultValue={permintaan.instansi} required maxLength={150}
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-2">Kegunaan Data</label>
                <div className="space-y-2">
                    {KEGUNAAN_OPTIONS.map((opt) => (
                        <label key={opt.value} className="relative block cursor-pointer">
                            <input type="radio" name="kegunaan_data" value={opt.value} defaultChecked={permintaan.kegunaan_data === opt.value} required className="peer sr-only" />
                            <div className="flex items-center gap-3 border-2 border-paper-200 bg-white rounded-xl px-4 py-2.5 transition-all peer-checked:border-azure-500 peer-checked:bg-azure-500/10 peer-checked:ring-2 peer-checked:ring-azure-500">
                                <span className="flex-1 text-sm text-navy-950">{opt.label}</span>
                                <div className="w-4 h-4 rounded-full shrink-0 flex items-center justify-center opacity-0 peer-checked:opacity-100 transition-opacity bg-navy-700">
                                    <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                                </div>
                            </div>
                        </label>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">Email</label>
                    <input name="email" type="email" defaultValue={permintaan.email} required maxLength={150}
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-navy-950 mb-1.5">No Handphone</label>
                    <input name="no_hp" type="tel" defaultValue={permintaan.no_hp} required maxLength={20}
                        className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Data/Konsultasi yang Dibutuhkan</label>
                <textarea name="kebutuhan_data" defaultValue={permintaan.kebutuhan_data} required maxLength={2000} rows={5}
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
            </div>

            <SubmitButton>Simpan Perubahan</SubmitButton>
        </form>
    );
}
