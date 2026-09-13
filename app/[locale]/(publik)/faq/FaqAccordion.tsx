'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';

/** ID item dipetakan ke kategori — urutan & isi teksnya sendiri datang
 *  dari file terjemahan (messages/id.json, messages/en.json), file ini
 *  cuma menyimpan STRUKTUR (kategori mana berisi item mana). */
const STRUKTUR_FAQ: { kategoriKey: string; itemKeys: string[] }[] = [
    {
        kategoriKey: 'antrian',
        itemKeys: ['cara-ambil-antrian', 'jam-pelayanan', 'cara-penilaian'],
    },
    {
        kategoriKey: 'permintaanData',
        itemKeys: ['harus-datang-langsung', 'kehilangan-link-permintaan', 'chat-jam-tertentu', 'privasi-permintaan'],
    },
    {
        kategoriKey: 'pengaduan',
        itemKeys: ['anonimitas-pengaduan', 'kehilangan-link-pengaduan', 'lama-tindak-lanjut'],
    },
    {
        kategoriKey: 'pestaKoja',
        itemKeys: ['apa-itu-pesta-koja', 'lihat-jadwal-petugas'],
    },
];

function AccordionItem({ itemKey }: { itemKey: string }) {
    const t = useTranslations('faq.items');
    const [buka, setBuka] = useState(false);
    return (
        <div className="border border-paper-200 rounded-xl overflow-hidden bg-white">
            <button
                onClick={() => setBuka(!buka)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-paper-50 transition-colors"
            >
                <span className="text-sm font-medium text-navy-950">{t(`${itemKey}.q`)}</span>
                <ChevronDown className={`w-4 h-4 text-navy-950/40 shrink-0 transition-transform ${buka ? 'rotate-180' : ''}`} />
            </button>
            {buka && (
                <div className="px-4 pb-4 text-sm text-navy-950/60 leading-relaxed border-t border-paper-100 pt-3">
                    {t(`${itemKey}.a`)}
                </div>
            )}
        </div>
    );
}

export function FaqAccordion() {
    const t = useTranslations('faq.categories');
    return (
        <div className="space-y-8">
            {STRUKTUR_FAQ.map((kat) => (
                <div key={kat.kategoriKey}>
                    <h2 className="text-sm font-bold text-navy-700 uppercase tracking-wide mb-3">{t(kat.kategoriKey)}</h2>
                    <div className="space-y-2">
                        {kat.itemKeys.map((itemKey) => (
                            <AccordionItem key={itemKey} itemKey={itemKey} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
