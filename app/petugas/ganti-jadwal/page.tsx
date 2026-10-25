import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatTanggal, todayDateStringWIB } from '@/lib/utils';
import { unstable_noStore as noStore } from 'next/cache';
import { GantiJadwalForm } from './GantiJadwalForm';
import { BatalkanRequestButton } from './BatalkanRequestButton';
import type { RequestGantiJadwal } from '@/lib/types/database';

export const dynamic = 'force-dynamic';

type ShiftRow = { id: number; nama_shift: string; jam_mulai: string; jam_selesai: string };

export default async function GantiJadwalPetugasPage() {
    noStore();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const today = todayDateStringWIB();

    const [{ data: jadwalRaw }, { data: shiftRaw }, { data: requestRaw }] = await Promise.all([
        supabase.from('jadwal_piket').select('id, tanggal, shift_id').eq('user_id', user!.id).eq('status', 'terjadwal').gte('tanggal', today).order('tanggal'),
        supabase.from('shift_piket').select('id, nama_shift, jam_mulai, jam_selesai').eq('is_aktif', true).order('jam_mulai'),
        supabase.from('request_ganti_jadwal').select('*').eq('pemohon_id', user!.id).order('created_at', { ascending: false }).limit(30),
    ]);

    const shifts = (shiftRaw ?? []) as ShiftRow[];
    const shiftMap = new Map(shifts.map((s) => [s.id, s]));
    const requests = (requestRaw ?? []) as RequestGantiJadwal[];

    // Daftar rekan (id + nama saja) lewat service role — tabel profiles
    // dilindungi RLS sehingga petugas biasa tidak bisa membaca profil rekan.
    const admin = createAdminClient();
    const { data: semuaPetugas } = await admin.from('profiles').select('id, name').in('role', ['petugas', 'admin']).order('name');
    const namaMap = new Map((semuaPetugas ?? []).map((p) => [p.id as string, p.name as string]));
    const rekan = (semuaPetugas ?? []).filter((p) => p.id !== user!.id).map((p) => ({ id: p.id as string, nama: p.name as string }));

    // Info jadwal untuk riwayat request (jadwal bisa sudah berpindah/terhapus)
    const jadwalIds = [...new Set(requests.map((r) => r.jadwal_piket_id))];
    const { data: jadwalRiwayat } = jadwalIds.length
        ? await supabase.from('jadwal_piket').select('id, tanggal, shift_id').in('id', jadwalIds)
        : { data: [] as { id: number; tanggal: string; shift_id: number }[] };
    const jadwalRiwayatMap = new Map((jadwalRiwayat ?? []).map((j) => [j.id, j]));

    const adaRequestMenunggu = new Set(requests.filter((r) => r.status === 'menunggu').map((r) => r.jadwal_piket_id));

    // Jadwal mendatang yang sudah dipresensi tidak boleh diganti
    const idJadwal = (jadwalRaw ?? []).map((j) => j.id);
    const { data: presensiAda } = idJadwal.length
        ? await supabase.from('presensi').select('jadwal_piket_id').in('jadwal_piket_id', idJadwal)
        : { data: [] as { jadwal_piket_id: number }[] };
    const sudahPresensi = new Set((presensiAda ?? []).map((p) => p.jadwal_piket_id));

    const opsiJadwal = (jadwalRaw ?? [])
        .filter((j) => !sudahPresensi.has(j.id))
        .map((j) => {
            const s = shiftMap.get(j.shift_id);
            return { id: j.id, label: `${formatTanggal(j.tanggal)} — Shift ${s?.nama_shift ?? '-'}`, sudahAdaRequest: adaRequestMenunggu.has(j.id) };
        });

    const opsiShift = shifts.map((s) => ({ id: s.id, label: `${s.nama_shift} (${s.jam_mulai.slice(0, 5)}–${s.jam_selesai.slice(0, 5)})` }));

    return (
        <>
            <h1 className="text-lg font-semibold text-navy-950 mb-1">Ganti Jadwal Piket</h1>
            <p className="text-sm text-navy-950/50 mb-5">Berhalangan di jadwal piket Anda? Ajukan penggantian — jadwal baru berubah setelah admin menyetujui.</p>

            <Card title="Ajukan Request" className="mb-5">
                <GantiJadwalForm jadwal={opsiJadwal} shifts={opsiShift} rekan={rekan} />
            </Card>

            <Card title="Riwayat Request Saya">
                {requests.length === 0 ? (
                    <div className="py-8 text-center text-navy-950/30 text-sm">Belum ada request.</div>
                ) : requests.map((r) => {
                    const j = jadwalRiwayatMap.get(r.jadwal_piket_id);
                    const shiftAsal = j ? shiftMap.get(j.shift_id) : undefined;
                    const shiftBaru = r.shift_baru_id ? shiftMap.get(r.shift_baru_id) : undefined;
                    return (
                        <div key={r.id} className="py-4 border-b border-paper-200 last:border-0">
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div className="text-sm">
                                    <div className="font-medium text-navy-950">
                                        {j ? `${formatTanggal(j.tanggal)} — Shift ${shiftAsal?.nama_shift ?? '-'}` : 'Jadwal (sudah berubah)'}
                                    </div>
                                    <div className="text-xs text-navy-950/60 mt-0.5">
                                        {r.jenis === 'digantikan'
                                            ? `Digantikan oleh ${namaMap.get(r.pengganti_id ?? '') ?? '—'}`
                                            : `Pindah ke ${r.tanggal_baru ? formatTanggal(r.tanggal_baru) : '-'} — Shift ${shiftBaru?.nama_shift ?? '-'}`}
                                    </div>
                                </div>
                                <Badge status={r.status} />
                            </div>
                            <p className="text-xs text-navy-950/50 mt-2">Alasan: {r.alasan}</p>
                            {r.catatan_admin && <p className="text-xs text-navy-950/70 mt-1">Catatan admin: {r.catatan_admin}</p>}
                            {r.status === 'menunggu' && <div className="mt-2"><BatalkanRequestButton requestId={r.id} /></div>}
                        </div>
                    );
                })}
            </Card>
        </>
    );
}
