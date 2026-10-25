'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { todayDateStringWIB } from '@/lib/utils';

/**
 * Request ganti jadwal/shift piket.
 *
 * Alur:
 *  1. Petugas mengajukan (ajukanGantiJadwal) atas SATU jadwal miliknya
 *     yang belum berjalan — pilih 'pindah' (ke tanggal/shift lain) atau
 *     'digantikan' (diambil alih rekan).
 *  2. Admin memutuskan (setujuiGantiJadwal / tolakGantiJadwal). Saat
 *     disetujui, jadwal_piket diubah di sini, dengan validasi ulang
 *     (jadwal bisa saja sudah berubah sejak request diajukan).
 *  3. Petugas boleh membatalkan selama masih 'menunggu' (batalkanGantiJadwal).
 */

type Hasil = { error?: string; success?: string };

function revalidasiJadwal() {
    revalidatePath('/petugas/jadwal');
    revalidatePath('/petugas/ganti-jadwal');
    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/petugas/jadwal-petugas');
    revalidatePath('/admin/ganti-jadwal');
    revalidatePath('/admin/jadwal');
    revalidatePath('/admin/jadwal-petugas');
    revalidatePath('/admin/dashboard');
    revalidatePath('/jadwal-petugas');
}

function hariDalamPekan(tanggal: string): number {
    const [y, m, d] = tanggal.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Minggu ... 6=Sabtu
}

const FORMAT_TANGGAL = /^\d{4}-\d{2}-\d{2}$/;

export async function ajukanGantiJadwal(params: {
    jadwalPiketId: number;
    jenis: 'pindah' | 'digantikan';
    alasan: string;
    tanggalBaru?: string;
    shiftBaruId?: number;
    penggantiId?: string;
}): Promise<Hasil> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const alasan = params.alasan.trim();
    if (alasan.length < 5) return { error: 'Alasan wajib diisi (minimal 5 karakter).' };
    if (alasan.length > 500) return { error: 'Alasan maksimal 500 karakter.' };
    if (params.jenis !== 'pindah' && params.jenis !== 'digantikan') return { error: 'Jenis request tidak valid.' };

    const { data: jadwal } = await supabase
        .from('jadwal_piket')
        .select('id, user_id, shift_id, tanggal, status')
        .eq('id', params.jadwalPiketId)
        .single();

    if (!jadwal || jadwal.user_id !== user.id) return { error: 'Jadwal tidak ditemukan atau bukan milik Anda.' };
    if (jadwal.status !== 'terjadwal') return { error: 'Hanya jadwal berstatus "Terjadwal" yang bisa diganti.' };
    if (jadwal.tanggal < todayDateStringWIB()) return { error: 'Jadwal yang sudah lewat tidak bisa diganti.' };

    const { data: sudahPresensi } = await supabase.from('presensi').select('id').eq('jadwal_piket_id', jadwal.id).maybeSingle();
    if (sudahPresensi) return { error: 'Jadwal ini sudah ada presensinya, tidak bisa diganti.' };

    const payload: Record<string, unknown> = {
        jadwal_piket_id: jadwal.id,
        pemohon_id: user.id,
        jenis: params.jenis,
        alasan,
        status: 'menunggu',
    };

    if (params.jenis === 'pindah') {
        const { tanggalBaru, shiftBaruId } = params;
        if (!tanggalBaru || !FORMAT_TANGGAL.test(tanggalBaru) || !shiftBaruId) return { error: 'Tanggal dan shift tujuan wajib diisi.' };
        if (tanggalBaru < todayDateStringWIB()) return { error: 'Tanggal tujuan tidak boleh sudah lewat.' };
        const hari = hariDalamPekan(tanggalBaru);
        if (hari === 0 || hari === 6) return { error: 'Tanggal tujuan jatuh di akhir pekan (tidak ada pelayanan).' };
        if (tanggalBaru === jadwal.tanggal && shiftBaruId === jadwal.shift_id) return { error: 'Tanggal dan shift tujuan sama dengan jadwal Anda saat ini.' };

        const { data: libur } = await supabase.from('hari_libur').select('keterangan').eq('tanggal', tanggalBaru).maybeSingle();
        if (libur) return { error: `Tanggal tujuan adalah hari libur (${libur.keterangan}).` };

        const { data: shift } = await supabase.from('shift_piket').select('id').eq('id', shiftBaruId).eq('is_aktif', true).maybeSingle();
        if (!shift) return { error: 'Shift tujuan tidak valid.' };

        const { data: bentrok } = await supabase
            .from('jadwal_piket').select('id').eq('user_id', user.id).eq('tanggal', tanggalBaru).eq('shift_id', shiftBaruId).maybeSingle();
        if (bentrok) return { error: 'Anda sudah punya jadwal pada tanggal dan shift tujuan tersebut.' };

        payload.tanggal_baru = tanggalBaru;
        payload.shift_baru_id = shiftBaruId;
    } else {
        const { penggantiId } = params;
        if (!penggantiId) return { error: 'Pilih petugas pengganti.' };
        if (penggantiId === user.id) return { error: 'Petugas pengganti tidak boleh diri sendiri.' };

        // profiles dilindungi RLS (petugas hanya bisa baca profil sendiri), jadi
        // validasi keberadaan pengganti lewat service role — hanya cek id & role.
        const admin = createAdminClient();
        const { data: pengganti } = await admin.from('profiles').select('id, role').eq('id', penggantiId).in('role', ['petugas', 'admin']).maybeSingle();
        if (!pengganti) return { error: 'Petugas pengganti tidak ditemukan.' };

        const { data: bentrok } = await supabase
            .from('jadwal_piket').select('id').eq('user_id', penggantiId).eq('tanggal', jadwal.tanggal).eq('shift_id', jadwal.shift_id).maybeSingle();
        if (bentrok) return { error: 'Petugas pengganti sudah punya jadwal pada tanggal dan shift yang sama.' };

        payload.pengganti_id = penggantiId;
    }

    const { error } = await supabase.from('request_ganti_jadwal').insert(payload);
    if (error) {
        if (error.code === '23505') return { error: 'Jadwal ini sudah punya request yang masih menunggu keputusan admin.' };
        return { error: `Gagal mengajukan request: ${error.message}` };
    }

    revalidasiJadwal();
    return { success: 'Request ganti jadwal terkirim. Menunggu persetujuan admin.' };
}

export async function batalkanGantiJadwal(requestId: number): Promise<Hasil> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data, error } = await supabase
        .from('request_ganti_jadwal')
        .update({ status: 'dibatalkan' })
        .eq('id', requestId)
        .eq('pemohon_id', user.id)
        .eq('status', 'menunggu')
        .select('id');

    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: 'Request tidak ditemukan atau sudah diputuskan admin.' };

    revalidasiJadwal();
    return { success: 'Request dibatalkan.' };
}

async function pastikanAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { supabase, user: null, error: 'Sesi tidak valid, silakan login ulang.' };
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { supabase, user: null, error: 'Hanya admin yang bisa memutuskan request ganti jadwal.' };
    return { supabase, user, error: null };
}

export async function setujuiGantiJadwal(requestId: number, catatan: string): Promise<Hasil> {
    const { supabase, user, error: authError } = await pastikanAdmin();
    if (!user) return { error: authError! };

    const { data: req } = await supabase.from('request_ganti_jadwal').select('*').eq('id', requestId).single();
    if (!req) return { error: 'Request tidak ditemukan.' };
    if (req.status !== 'menunggu') return { error: 'Request ini sudah diputuskan sebelumnya.' };

    const { data: jadwal } = await supabase
        .from('jadwal_piket').select('id, user_id, shift_id, tanggal, status').eq('id', req.jadwal_piket_id).single();
    if (!jadwal) return { error: 'Jadwal asal sudah tidak ada (mungkin dihapus). Tolak request ini.' };
    if (jadwal.user_id !== req.pemohon_id) return { error: 'Pemilik jadwal sudah berubah sejak request diajukan. Tolak request ini.' };
    if (jadwal.status !== 'terjadwal') return { error: 'Status jadwal sudah berubah dari "Terjadwal". Tolak request ini.' };
    if (jadwal.tanggal < todayDateStringWIB()) return { error: 'Jadwal sudah lewat, request tidak bisa diterapkan. Tolak request ini.' };

    const { data: sudahPresensi } = await supabase.from('presensi').select('id').eq('jadwal_piket_id', jadwal.id).maybeSingle();
    if (sudahPresensi) return { error: 'Jadwal sudah ada presensinya, request tidak bisa diterapkan. Tolak request ini.' };

    const perubahan = req.jenis === 'pindah'
        ? { tanggal: req.tanggal_baru as string, shift_id: req.shift_baru_id as number }
        : { user_id: req.pengganti_id as string };

    if (req.jenis === 'pindah') {
        const hari = hariDalamPekan(req.tanggal_baru);
        if (hari === 0 || hari === 6) return { error: 'Tanggal tujuan jatuh di akhir pekan. Tolak request ini.' };
        const { data: libur } = await supabase.from('hari_libur').select('keterangan').eq('tanggal', req.tanggal_baru).maybeSingle();
        if (libur) return { error: `Tanggal tujuan kini ditandai hari libur (${libur.keterangan}). Tolak request ini.` };
    }

    const { error: updError } = await supabase.from('jadwal_piket').update(perubahan).eq('id', jadwal.id);
    if (updError) {
        if (updError.code === '23505') {
            return { error: req.jenis === 'pindah'
                ? 'Petugas sudah punya jadwal pada tanggal dan shift tujuan. Tolak request ini.'
                : 'Petugas pengganti sudah punya jadwal pada tanggal dan shift tersebut. Tolak request ini.' };
        }
        return { error: `Gagal menerapkan perubahan jadwal: ${updError.message}` };
    }

    const { error: reqError } = await supabase.from('request_ganti_jadwal').update({
        status: 'disetujui',
        catatan_admin: catatan.trim() || null,
        diputuskan_oleh: user.id,
        diputuskan_at: new Date().toISOString(),
    }).eq('id', requestId);
    if (reqError) return { error: `Jadwal sudah diubah, tapi status request gagal disimpan: ${reqError.message}` };

    revalidasiJadwal();
    return { success: 'Request disetujui dan jadwal sudah diperbarui.' };
}

export async function tolakGantiJadwal(requestId: number, catatan: string): Promise<Hasil> {
    const { supabase, user, error: authError } = await pastikanAdmin();
    if (!user) return { error: authError! };

    const { data, error } = await supabase
        .from('request_ganti_jadwal')
        .update({
            status: 'ditolak',
            catatan_admin: catatan.trim() || null,
            diputuskan_oleh: user.id,
            diputuskan_at: new Date().toISOString(),
        })
        .eq('id', requestId)
        .eq('status', 'menunggu')
        .select('id');

    if (error) return { error: error.message };
    if (!data || data.length === 0) return { error: 'Request tidak ditemukan atau sudah diputuskan sebelumnya.' };

    revalidasiJadwal();
    return { success: 'Request ditolak.' };
}
