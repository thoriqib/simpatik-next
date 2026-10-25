import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatTanggal } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';
import { KeputusanButtons } from './KeputusanButtons';
import type { RequestGantiJadwal } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

type ShiftRow = { id: number; nama_shift: string; jam_mulai: string; jam_selesai: string };

export default async function GantiJadwalAdminPage() {
    noStore();
    const supabase = await createClient();

    const [{ data: requestRaw }, { data: profilRaw }, { data: shiftRaw }] = await Promise.all([
        supabase.from('request_ganti_jadwal').select('*').order('created_at', { ascending: false }).limit(200),
        supabase.from('profiles').select('id, name'),
        supabase.from('shift_piket').select('id, nama_shift, jam_mulai, jam_selesai'),
    ]);

    const requests = (requestRaw ?? []) as RequestGantiJadwal[];
    const nama = new Map((profilRaw ?? []).map((p) => [p.id as string, p.name as string]));
    const shiftMap = new Map(((shiftRaw ?? []) as ShiftRow[]).map((s) => [s.id, s]));

    const jadwalIds = [...new Set(requests.map((r) => r.jadwal_piket_id))];
    const { data: jadwalRaw } = jadwalIds.length
        ? await supabase.from('jadwal_piket').select('id, tanggal, shift_id').in('id', jadwalIds)
        : { data: [] as { id: number; tanggal: string; shift_id: number }[] };
    const jadwalMap = new Map((jadwalRaw ?? []).map((j) => [j.id, j]));

    const menunggu = requests.filter((r) => r.status === 'menunggu').sort((a, b) => a.created_at.localeCompare(b.created_at));
    const riwayat = requests.filter((r) => r.status !== 'menunggu');

    function Ringkasan({ r }: { r: RequestGantiJadwal }) {
        const j = jadwalMap.get(r.jadwal_piket_id);
        const shiftAsal = j ? shiftMap.get(j.shift_id) : undefined;
        const shiftBaru = r.shift_baru_id ? shiftMap.get(r.shift_baru_id) : undefined;
        return (
            <div className="text-sm">
                <div className="font-medium text-navy-950">{nama.get(r.pemohon_id) ?? 'Petugas'}</div>
                <div className="text-xs text-navy-950/60 mt-0.5">
                    Jadwal: {j ? `${formatTanggal(j.tanggal)} — Shift ${shiftAsal?.nama_shift ?? '-'}` : 'sudah berubah/terhapus'}
                </div>
                <div className="text-xs text-navy-950/60">
                    {r.jenis === 'digantikan'
                        ? `Digantikan oleh: ${nama.get(r.pengganti_id ?? '') ?? '—'}`
                        : `Pindah ke: ${r.tanggal_baru ? formatTanggal(r.tanggal_baru) : '-'} — Shift ${shiftBaru?.nama_shift ?? '-'}`}
                </div>
                <div className="text-xs text-navy-950/50 mt-1">Alasan: {r.alasan}</div>
            </div>
        );
    }

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-1">Request Ganti Jadwal</h1>
            <p className="text-sm text-navy-950/50 mb-5">Request petugas yang berhalangan. Jadwal piket berubah otomatis begitu Anda menyetujui.</p>

            <Card title={`Menunggu Keputusan (${menunggu.length})`} className="mb-5">
                {menunggu.length === 0 ? (
                    <div className="py-8 text-center text-navy-950/30 text-sm">Tidak ada request yang menunggu.</div>
                ) : menunggu.map((r) => (
                    <div key={r.id} className="py-4 border-b border-paper-200 last:border-0 flex flex-wrap items-start justify-between gap-3">
                        <Ringkasan r={r} />
                        <KeputusanButtons requestId={r.id} namaPemohon={nama.get(r.pemohon_id) ?? 'Petugas'} />
                    </div>
                ))}
            </Card>

            <Card title="Riwayat Keputusan">
                {riwayat.length === 0 ? (
                    <div className="py-8 text-center text-navy-950/30 text-sm">Belum ada riwayat.</div>
                ) : riwayat.map((r) => (
                    <div key={r.id} className="py-4 border-b border-paper-200 last:border-0 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <Ringkasan r={r} />
                            {r.catatan_admin && <div className="text-xs text-navy-950/70 mt-1">Catatan admin: {r.catatan_admin}</div>}
                        </div>
                        <Badge status={r.status} />
                    </div>
                ))}
            </Card>
        </>
    );
}
