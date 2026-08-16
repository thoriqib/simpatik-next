'use client';

import { useActionState } from 'react';
import { tambahLinkPestaKoja, editLinkPestaKoja } from '@/lib/actions/pesta-koja';
import { SubmitButton } from '@/components/ui/SubmitButton';
import { PESTA_KOJA_ICON_OPTIONS, getPestaKojaIcon } from '@/lib/pesta-koja-icons';
import type { PestaKojaLink } from '@/lib/types/database';

export function LinkForm({ link }: { link?: PestaKojaLink }) {
    const action = link ? editLinkPestaKoja.bind(null, link.id) : tambahLinkPestaKoja;
    const [state, formAction] = useActionState(action, null);

    return (
        <form action={formAction} className="space-y-4">
            {state?.error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{state.error}</div>}

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Judul</label>
                <input name="judul" defaultValue={link?.judul} required maxLength={150}
                    placeholder="Contoh: PANDAWA (Pelayanan Data Via WA)"
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Deskripsi</label>
                <textarea name="deskripsi" defaultValue={link?.deskripsi} required maxLength={300} rows={3}
                    placeholder="Jelaskan singkat kegunaan link ini..."
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-1.5">Link (URL)</label>
                <input name="url" type="url" defaultValue={link?.url} required maxLength={500}
                    placeholder="https://..."
                    className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500" />
            </div>

            <div>
                <label className="block text-sm font-medium text-navy-950 mb-2">Ikon</label>
                <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                    {PESTA_KOJA_ICON_OPTIONS.map((key) => {
                        const Icon = getPestaKojaIcon(key);
                        return (
                            <label key={key} className="relative cursor-pointer">
                                <input type="radio" name="ikon" value={key} defaultChecked={(link?.ikon ?? 'link') === key} className="peer sr-only" />
                                <div className="w-full aspect-square rounded-xl border-2 border-paper-200 bg-white flex items-center justify-center text-navy-950/50 transition-all peer-checked:border-azure-500 peer-checked:bg-azure-500/10 peer-checked:text-azure-500">
                                    <Icon className="w-4 h-4" />
                                </div>
                            </label>
                        );
                    })}
                </div>
            </div>

            <SubmitButton>{link ? 'Simpan Perubahan' : 'Tambah Link'}</SubmitButton>
        </form>
    );
}
