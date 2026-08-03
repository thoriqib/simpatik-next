'use client';

import { useState, useRef } from 'react';
import { importJadwalCSV } from '@/lib/actions/jadwal';

/**
 * Import jadwal massal dari CSV — pengganti fitur upload template Excel
 * di versi Laravel. Format kolom: nama_petugas,shift,tanggal (DD/MM/YYYY).
 * File CSV bisa dibuat/diedit lewat Excel biasa (Save As → CSV).
 */
export function CsvImport() {
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setLoading(true);
        setFileName(file.name);
        const text = await file.text();
        const lines = text.trim().split('\n').slice(1); // skip header
        const rows = lines.map((line) => {
            const [nama, shift, tanggal] = line.split(',').map((s) => s.trim());
            return { nama, shift, tanggal };
        }).filter((r) => r.nama);

        const res = await importJadwalCSV(rows);
        setResult(res);
        setLoading(false);
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-paper-200 p-6 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-navy-950">📥 Import Jadwal dari CSV</h3>
                    <p className="text-xs text-navy-950/50 mt-0.5">
                        Format kolom: <code className="bg-paper-100 px-1 rounded">nama_petugas,shift,tanggal</code> (tanggal format DD/MM/YYYY).
                        Bisa dibuat/diedit lewat Excel (Save As → CSV).
                    </p>
                </div>
            </div>
            <hr className="my-4 border-paper-200" />
            <div
                className="border-2 border-dashed border-paper-200 bg-paper-50 rounded-xl p-6 text-center cursor-pointer"
                onClick={() => fileInput.current?.click()}
            >
                <p className="text-sm text-navy-950/60">
                    {fileName ? <span className="font-semibold text-navy-700">{fileName}</span> : <><span className="font-semibold text-azure-500">Klik untuk memilih file</span> CSV jadwal</>}
                </p>
                <input ref={fileInput} type="file" accept=".csv" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {loading && <p className="text-sm text-navy-950/50 mt-3">Memproses...</p>}

            {result && (
                <div className="mt-4 p-4 bg-azure-500/10 border border-blue-200 rounded-xl text-sm">
                    <p className="font-semibold text-blue-800">
                        Import selesai: {result.imported} jadwal berhasil ditambahkan
                        {result.skipped > 0 && `, ${result.skipped} baris dilewati`}.
                    </p>
                    {result.errors.length > 0 && (
                        <>
                            <button onClick={() => setShowErrors(!showErrors)} className="text-xs text-azure-500 hover:underline mt-2">
                                {showErrors ? 'Sembunyikan' : 'Tampilkan'} detail ({result.errors.length})
                            </button>
                            {showErrors && (
                                <ul className="mt-2 space-y-1">
                                    {result.errors.map((e, i) => <li key={i} className="text-xs text-navy-950/60">• {e}</li>)}
                                </ul>
                            )}
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
