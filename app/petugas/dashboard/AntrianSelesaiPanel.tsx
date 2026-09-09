import { Card } from '@/components/ui/Card';
import { QrTiketButton } from '@/components/QrTiketButton';
import type { Antrian } from '@/lib/types/database';

/**
 * Antrian yang sudah selesai dilayani hari ini — kebalikan dari
 * AntrianPanel (yang cuma tampilkan status aktif: menunggu/dipanggil/
 * dilayani). Read-only, tanpa tombol aksi status (sudah final), cuma
 * tombol QR untuk kalau pengunjung butuh link tiketnya lagi (mis. mau
 * isi penilaian tapi link-nya hilang).
 */
export function AntrianSelesaiPanel({ antrianSelesai }: { antrianSelesai: Antrian[] }) {
    return (
        <Card title="Antrian Selesai Dilayani Hari Ini">
            {antrianSelesai.length > 0 ? (
                <div className="overflow-x-auto -mx-6 px-6">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-paper-200 text-navy-950/40 text-left text-xs uppercase tracking-wide">
                                <th className="pb-3 font-medium">Kode</th>
                                <th className="pb-3 font-medium">Nama</th>
                                <th className="pb-3 font-medium">Layanan</th>
                                <th className="pb-3 font-medium">Jam Selesai</th>
                                <th className="pb-3 font-medium">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-paper-100">
                            {antrianSelesai.map((item) => (
                                <tr key={item.id} className="hover:bg-paper-50 transition-colors">
                                    <td className="py-3 font-mono font-semibold text-navy-700 text-base tabular">{item.kode_antrian}</td>
                                    <td className="py-3">
                                        <div className="font-medium text-navy-950">{item.nama_pengunjung}</div>
                                        {item.no_hp && <div className="text-xs text-navy-950/40">{item.no_hp}</div>}
                                    </td>
                                    <td className="py-3 text-navy-950/60 text-xs">{item.jenis_layanan?.nama_layanan}</td>
                                    <td className="py-3 text-navy-950/50 text-xs">
                                        {item.waktu_selesai
                                            ? new Date(item.waktu_selesai).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jakarta' }) + ' WIB'
                                            : '-'}
                                    </td>
                                    <td className="py-3">
                                        <QrTiketButton kodeAntrian={item.kode_antrian} namaPengunjung={item.nama_pengunjung} />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="py-10 text-center text-navy-950/30"><p className="text-sm">Belum ada antrian yang selesai dilayani hari ini.</p></div>
            )}
        </Card>
    );
}
