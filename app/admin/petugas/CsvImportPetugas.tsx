'use client';

import { useState, useRef } from 'react';
import { importPetugasCSV } from '@/lib/actions/auth';
import { Download, Upload } from 'lucide-react';

/**
 * Import petugas massal dari CSV. Format kolom: nama,email,password_opsional.
 * Nama boleh mengandung koma (gelar akademik seperti ", SST") — WAJIB
 * dibungkus tanda kutip ganda di file CSV, contoh: "Ari Hidayat, SST".
 * Excel otomatis melakukan ini sendiri saat Save As → CSV.
 */
function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (inQuotes) {
            if (char === '"') {
                if (line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += char;
            }
        } else {
            if (char === '"') {
                inQuotes = true;
            } else if (char === ',') {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    result.push(current.trim());
    return result;
}

export function CsvImportPetugas() {
    const [open, setOpen] = useState(false);
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[]; defaultPassword: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setLoading(true);
        setFileName(file.name);
        const text = await file.text();
        const lines = text.trim().split('\n').slice(1); // skip header
        const rows = lines.map((line) => {
            const [nama, email, password] = parseCsvLine(line);
            return { nama, email, password: password || undefined };
        }).filter((r) => r.nama && r.email);

        const res = await importPetugasCSV(rows);
        setResult(res);
        setLoading(false);
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950 px-4 py-2 rounded-xl text-sm font-medium hover:bg-paper-200 transition-colors"
            >
                <Upload className="w-4 h-4" />
                Import CSV
            </button>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-paper-200 p-6 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-navy-950">📥 Import Petugas dari CSV</h3>
                    <p className="text-xs text-navy-950/50 mt-0.5">
                        Format kolom: <code className="bg-paper-100 px-1 rounded">nama,email,password_opsional</code>.
                        Nama bergelar (mengandung koma) harus dibungkus tanda kutip: <code className="bg-paper-100 px-1 rounded">&quot;Ari Hidayat, SST&quot;</code>
                    </p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <a
                        href="/templates/petugas-template.csv"
                        download
                        className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-paper-200 transition-colors"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Template
                    </a>
                    <button onClick={() => setOpen(false)} className="text-navy-950/40 hover:text-navy-950 text-xs px-2">
                        Tutup
                    </button>
                </div>
            </div>
            <hr className="my-4 border-paper-200" />
            <div
                className="border-2 border-dashed border-paper-200 bg-paper-50 rounded-xl p-6 text-center cursor-pointer"
                onClick={() => fileInput.current?.click()}
            >
                <Upload className="w-6 h-6 text-navy-950/30 mx-auto mb-2" />
                <p className="text-sm text-navy-950/60">
                    {fileName ? <span className="font-semibold text-navy-700">{fileName}</span> : <><span className="font-semibold text-azure-500">Klik untuk memilih file</span> CSV petugas</>}
                </p>
                <input ref={fileInput} type="file" accept=".csv" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {loading && <p className="text-sm text-navy-950/50 mt-3">Memproses... (satu per satu, mungkin butuh beberapa detik)</p>}

            {result && (
                <div className="mt-4 p-4 bg-azure-500/10 border border-blue-200 rounded-xl text-sm">
                    <p className="font-semibold text-blue-800">
                        Import selesai: {result.imported} akun petugas berhasil dibuat
                        {result.skipped > 0 && `, ${result.skipped} baris dilewati`}.
                    </p>
                    {result.imported > 0 && (
                        <p className="text-xs text-navy-950/60 mt-1.5">
                            Password default untuk akun baru: <code className="bg-white px-1.5 py-0.5 rounded font-mono">{result.defaultPassword}</code>
                            {' '}— sampaikan ke petugas terkait untuk segera menggantinya setelah login pertama.
                        </p>
                    )}
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
