'use client';

import { useState, useTransition } from 'react';
import { Modal } from '@/components/ui/Modal';
import { ubahStatusJadwal } from '@/lib/actions/jadwal';
import { CalendarX } from 'lucide-react';

const OPSI_STATUS = [
    { value: 'terjadwal', label: 'Terjadwal (belum ada keterangan)' },
    { value: 'izin', label: 'Izin' },
    { value: 'sakit', label: 'Sakit' },
    { value: 'alpha', label: 'Alpha (tidak hadir tanpa keterangan)' },
];

export function UbahStatusButton({
    jadwalPiketId,
    statusAwal,
    keteranganAwal,
    namaPetugas,
}: {
    jadwalPiketId: number;
    statusAwal: string;
    keteranganAwal: string | null;
    namaPetugas: string;
}) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState('');
    const [status, setStatus] = useState(statusAwal === 'hadir' ? 'terjadwal' : statusAwal);
    const [keterangan, setKeterangan] = useState(keteranganAwal ?? '');

    function handleSimpan(e: React.FormEvent) {
        e.preventDefault();
        setError('');
        startTransition(async () => {
            const res = await ubahStatusJadwal(jadwalPiketId, status, keterangan);
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
                className="inline-flex items-center gap-1 text-navy-950/50 hover:text-navy-950 hover:underline text-xs"
                title="Ubah status kehadiran (Izin/Sakit/Alpha)"
            >
                <CalendarX className="w-3 h-3" /> Status
            </button>

            <Modal open={open} onClose={() => setOpen(false)} title={`Ubah Status Kehadiran — ${namaPetugas}`}>
                <form onSubmit={handleSimpan} className="space-y-4">
                    {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg text-sm">{error}</div>}
                    <div>
                        <label className="block text-sm font-medium text-navy-950 mb-1.5">Status Kehadiran</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm bg-white"
                        >
                            {OPSI_STATUS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-navy-950 mb-1.5">
                            Keterangan <span className="text-navy-950/40 font-normal">(opsional)</span>
                        </label>
                        <textarea
                            value={keterangan}
                            onChange={(e) => setKeterangan(e.target.value)}
                            rows={3}
                            maxLength={500}
                            placeholder="Contoh: Sakit demam, ada surat dokter"
                            className="w-full border border-paper-200 rounded-xl px-3.5 py-2.5 text-sm resize-none"
                        />
                    </div>
                    <p className="text-xs text-navy-950/40">
                        Catatan: kalau petugas sudah presensi (masuk/keluar tercatat), presensinya tidak otomatis
                        terhapus saat status diubah — batalkan presensi dulu lewat tombol terpisah kalau perlu.
                    </p>
                    <button
                        type="submit"
                        disabled={isPending}
                        className="w-full bg-navy-700 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-navy-800 transition-colors disabled:opacity-50"
                    >
                        {isPending ? 'Menyimpan...' : 'Simpan Status'}
                    </button>
                </form>
            </Modal>
        </>
    );
}
