'use client';

import { useState, useTransition } from 'react';
import { ambilQrTiket } from '@/lib/actions/antrian';
import { QrCode, X, Copy, Check } from 'lucide-react';

/**
 * Tombol "Tampilkan QR" — dipakai di baris antrian (baik yang masih
 * menunggu/dipanggil/dilayani, maupun yang sudah selesai). Berguna
 * kalau pengunjung tidak menyimpan link tiketnya sendiri — petugas
 * bisa tunjukkan QR ini langsung dari layar petugas untuk di-scan
 * pengunjung di tempat, tanpa perlu ketik/kirim link manual.
 */
export function QrTiketButton({ kodeAntrian, namaPengunjung }: { kodeAntrian: string; namaPengunjung: string }) {
    const [buka, setBuka] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [qrDataUri, setQrDataUri] = useState<string | null>(null);
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [disalin, setDisalin] = useState(false);

    function handleBuka() {
        setBuka(true);
        setError('');
        startTransition(async () => {
            const res = await ambilQrTiket(kodeAntrian);
            if (res.error) {
                setError(res.error);
                return;
            }
            setQrDataUri(res.qrDataUri ?? null);
            setUrl(res.url ?? null);
        });
    }

    async function handleSalin() {
        if (!url) return;
        try {
            await navigator.clipboard.writeText(url);
            setDisalin(true);
            setTimeout(() => setDisalin(false), 2000);
        } catch {
            // Clipboard API mungkin diblokir browser tertentu — link tetap
            // bisa disalin manual karena ditampilkan sebagai teks biasa.
        }
    }

    return (
        <>
            <button
                onClick={handleBuka}
                className="inline-flex items-center gap-1.5 bg-paper-100 text-navy-950/70 px-3 py-1.5 rounded-xl text-xs font-medium hover:bg-paper-200 transition-colors"
                title="Tampilkan QR code tiket untuk di-scan pengunjung"
            >
                <QrCode className="w-3.5 h-3.5" /> QR
            </button>

            {buka && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/50 backdrop-blur-sm" onClick={() => setBuka(false)}>
                    <div className="bg-white rounded-2xl shadow-card max-w-xs w-full p-6 relative text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setBuka(false)}
                            className="absolute top-4 right-4 text-navy-950/30 hover:text-navy-950 transition-colors"
                            aria-label="Tutup"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="text-xs text-navy-950/40 uppercase tracking-wide mb-1">Tiket Antrian</div>
                        <div className="font-mono font-bold text-2xl text-navy-700 mb-1">{kodeAntrian}</div>
                        <div className="text-sm text-navy-950/60 mb-4">{namaPengunjung}</div>

                        {isPending && (
                            <div className="w-48 h-48 mx-auto flex items-center justify-center">
                                <div className="w-8 h-8 rounded-full border-[3px] border-paper-200 border-t-azure-500 animate-spin" />
                            </div>
                        )}

                        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-xs">{error}</div>}

                        {qrDataUri && !isPending && (
                            <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={qrDataUri} alt={`QR tiket ${kodeAntrian}`} className="w-48 h-48 mx-auto border border-paper-200 rounded-xl p-2" />
                                <p className="text-xs text-navy-950/40 mt-3 mb-3">Minta pengunjung memindai kode ini dengan kamera ponsel</p>
                                <button
                                    onClick={handleSalin}
                                    className="w-full inline-flex items-center justify-center gap-1.5 bg-paper-100 text-navy-950 py-2 rounded-xl text-xs font-medium hover:bg-paper-200 transition-colors"
                                >
                                    {disalin ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                    {disalin ? 'Link Tersalin!' : 'Salin Link Tiket'}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
