'use client';

import { useState, useRef } from 'react';
import { importJadwal } from '@/lib/actions/jadwal';
import { Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

/**
 * Import jadwal massal dari file Excel (.xlsx) — sebelumnya CSV, diganti
 * supaya lebih mudah diisi/diedit admin (banyak yang lebih terbiasa
 * dengan Excel daripada CSV mentah, terutama untuk data bertanggal).
 * Format kolom tetap sama: email_petugas, shift, tanggal (DD/MM/YYYY).
 * Dicocokkan lewat EMAIL (bukan nama) — email selalu unik, tidak pernah
 * mengandung koma/gelar akademik yang bisa memecah kolom.
 */
export function ExcelImport() {
    const [fileName, setFileName] = useState('');
    const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showErrors, setShowErrors] = useState(false);
    const [errorBaca, setErrorBaca] = useState('');
    const fileInput = useRef<HTMLInputElement>(null);

    async function handleFile(file: File) {
        setLoading(true);
        setErrorBaca('');
        setResult(null);
        setFileName(file.name);

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array', cellDates: false });
            const sheetPertama = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetPertama];

            // header: 1 → baris pertama dianggap header, dilewati otomatis
            // raw: false → nilai tanggal dibaca sebagai teks apa adanya (DD/MM/YYYY),
            // bukan dikonversi jadi serial number Excel.
            const data = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, raw: false, defval: '' });

            const rows = data.slice(1) // lewati baris header
                .map((row) => ({
                    email: String(row[0] ?? '').trim(),
                    shift: String(row[1] ?? '').trim(),
                    tanggal: String(row[2] ?? '').trim(),
                }))
                .filter((r) => r.email);

            if (rows.length === 0) {
                setErrorBaca('Tidak ada baris data yang bisa dibaca. Pastikan format file sesuai template.');
                setLoading(false);
                return;
            }

            const res = await importJadwal(rows);
            setResult(res);
        } catch {
            setErrorBaca('Gagal membaca file. Pastikan file berformat .xlsx yang valid (bukan hasil edit manual ekstensi file).');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-paper-200 p-6 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h3 className="text-sm font-semibold text-navy-950">📥 Import Jadwal dari Excel</h3>
                    <p className="text-xs text-navy-950/50 mt-0.5">
                        Format kolom: <code className="bg-paper-100 px-1 rounded">email_petugas, shift, tanggal</code> (tanggal format DD/MM/YYYY).
                        Unduh template di bawah supaya format pasti sesuai.
                    </p>
                </div>
                <a
                    href="/templates/jadwal-template.xlsx"
                    download
                    className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950 px-3.5 py-2 rounded-xl text-xs font-semibold hover:bg-paper-200 transition-colors shrink-0"
                >
                    <Download className="w-3.5 h-3.5" />
                    Download Template Excel
                </a>
            </div>
            <hr className="my-4 border-paper-200" />
            <div
                className="border-2 border-dashed border-paper-200 bg-paper-50 rounded-xl p-6 text-center cursor-pointer"
                onClick={() => fileInput.current?.click()}
            >
                <Upload className="w-6 h-6 text-navy-950/30 mx-auto mb-2" />
                <p className="text-sm text-navy-950/60">
                    {fileName ? <span className="font-semibold text-navy-700">{fileName}</span> : <><span className="font-semibold text-azure-500">Klik untuk memilih file</span> Excel jadwal (.xlsx)</>}
                </p>
                <input ref={fileInput} type="file" accept=".xlsx,.xls" className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            </div>

            {loading && <p className="text-sm text-navy-950/50 mt-3">Memproses...</p>}

            {errorBaca && (
                <div className="mt-4 p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
                    {errorBaca}
                </div>
            )}

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
