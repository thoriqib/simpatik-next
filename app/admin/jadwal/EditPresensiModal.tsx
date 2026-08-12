'use client';

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { editPresensiAdmin } from '@/lib/actions/presensi';
import { Pencil } from 'lucide-react';

/** Ubah ISO string (UTC) jadi "HH:MM" dalam WIB, untuk isi awal input time. */
function isoKeJamWIB(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta', hour12: false });
}

export function EditPresensiButton({
    presensiId,
    jadwalPiketId,
    tanggal,
    waktuMasukAwal,
    waktuKeluarAwal,
    namaPetugas,
}: {
    presensiId: number | null;
    jadwalPiketId: number;
    tanggal: string;
    waktuMasukAwal: string | null;
    waktuKeluarAwal: string | null;
    namaPetugas: string;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [waktuMasuk, setWaktuMasuk] = useState(isoKeJamWIB(waktuMasukAwal));
    const [waktuKeluar, setWaktuKeluar] = useState(isoKeJamWIB(waktuKeluarAwal));

    function handleSimpan(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        startTransition(async () => {
            const res = await editPresensiAdmin({
                jadwalPiketId,
                presensiId,
                tanggal,
                waktuMasuk,
                waktuKeluar,
            });
            if (res?.error) {
                setError(res.error);
                return;
            }
            window.location.reload();
        });
    }

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1 text-azure-500 hover:underline text-xs"
                title="Edit waktu presensi"
            >
                <Pencil className="w-3 h-3" /> Edit
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title={`Edit Presensi — ${namaPetugas}`}>
                <form onSubmit={handleSimpan} className="space-y-4">
                    {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
                    <p className="text-xs text-navy-950/50">
                        Tanggal: <strong className="text-navy-950">{new Date(tanggal).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong>
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-navy-950 mb-1.5">Jam Masuk (WIB)</label>
                        <input
                            type="time"
                            value={waktuMasuk}
                            onChange={(e) => setWaktuMasuk(e.target.value)}
                            required
                            className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950 mb-1.5">
                            Jam Keluar (WIB) <span className="text-navy-950/40 font-normal">(kosongkan kalau belum keluar)</span>
                        </label>
                        <input
                            type="time"
                            value={waktuKeluar}
                            onChange={(e) => setWaktuKeluar(e.target.value)}
                            className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm"
                        />
                    </div>
                    <p className="text-xs text-navy-950/40">
                        Keterlambatan, sisa waktu pelayanan, dan kekurangan jam akan dihitung ulang otomatis berdasarkan jam shift yang berlaku.
                    </p>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-navy-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </Modal>
        </>
    );
}
