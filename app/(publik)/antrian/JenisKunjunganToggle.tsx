'use client';

import { useState } from 'react';
import { AmbilAntrianForm } from './AmbilAntrianForm';
import { MitraStatistikForm } from './MitraStatistikForm';
import { Users, Briefcase } from 'lucide-react';
import type { JenisLayanan } from '@/lib/types/database';

export function JenisKunjunganToggle({ jenisLayanan }: { jenisLayanan: JenisLayanan[] }) {
    const [tab, setTab] = useState<'umum' | 'mitra'>('umum');

    return (
        <>
            <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                    type="button"
                    onClick={() => setTab('umum')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border-2 transition-all ${
                        tab === 'umum' ? 'border-navy-700 bg-navy-700 text-white' : 'border-paper-200 bg-white text-navy-950/60 hover:border-paper-300'
                    }`}
                >
                    <Users className="w-4 h-4" />
                    Pengunjung Umum
                </button>
                <button
                    type="button"
                    onClick={() => setTab('mitra')}
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold border-2 transition-all ${
                        tab === 'mitra' ? 'border-navy-700 bg-navy-700 text-white' : 'border-paper-200 bg-white text-navy-950/60 hover:border-paper-300'
                    }`}
                >
                    <Briefcase className="w-4 h-4" />
                    Mitra Statistik
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-soft border border-paper-200 p-6 sm:p-7">
                {tab === 'umum' ? <AmbilAntrianForm jenisLayanan={jenisLayanan} /> : <MitraStatistikForm />}
            </div>
        </>
    );
}
