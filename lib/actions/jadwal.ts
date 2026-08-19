'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

export async function tambahJadwal(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const user_id = formData.get('user_id') as string;
    const shift_id = Number(formData.get('shift_id'));
    const tanggal = formData.get('tanggal') as string;

    const supabase = await createClient();
    const { error } = await supabase.from('jadwal_piket').insert({ user_id, shift_id, tanggal, status: 'terjadwal' });

    if (error) {
        // unique constraint violation -> duplikat, cukup diamkan (setara firstOrCreate Laravel)
        if (error.code !== '23505') return { error: error.message };
    }

    revalidatePath('/admin/jadwal');
    return null;
}

export async function hapusJadwal(id: number) {
    const supabase = await createClient();
    await supabase.from('jadwal_piket').delete().eq('id', id);
    revalidatePath('/admin/jadwal');
}

/**
 * Khusus admin: ubah status kehadiran jadwal piket jadi Izin/Sakit/Alpha/
 * Terjadwal, dengan keterangan opsional (alasan). Kalau jadwal itu sudah
 * ada presensi (petugas sudah masuk/keluar), presensinya TIDAK dihapus
 * otomatis — admin perlu batalkan presensi dulu lewat tombol terpisah
 * kalau memang ingin mengubah jadi izin/sakit murni tanpa jejak presensi.
 */
export async function ubahStatusJadwal(jadwalPiketId: number, status: string, keterangan: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa mengubah status kehadiran.' };

    if (!['terjadwal', 'hadir', 'izin', 'sakit', 'alpha'].includes(status)) {
        return { error: 'Status tidak valid.' };
    }

    const { error } = await supabase
        .from('jadwal_piket')
        .update({ status, keterangan: keterangan.trim() || null })
        .eq('id', jadwalPiketId);

    if (error) return { error: error.message };

    revalidatePath('/admin/jadwal');
    revalidatePath('/petugas/jadwal');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');
    return { success: true };
}

/**
 * Import massal jadwal dari CSV (kolom: email_petugas, shift, tanggal DD/MM/YYYY).
 * [UPDATE] Dicocokkan lewat EMAIL, bukan nama — email selalu unik dan tidak
 * pernah mengandung koma/gelar yang bisa memecah kolom CSV, jauh lebih aman
 * dibanding mencocokkan lewat nama lengkap.
 */
/**
 * Import jadwal massal — dipanggil dari client setelah file Excel/CSV
 * di-parse jadi array baris. Fungsi ini sendiri format-agnostic (cuma
 * terima data yang sudah diparse), jadi bisa dipakai lagi kalau nanti
 * sumber datanya berubah format lagi.
 */
export async function importJadwal(rows: { email: string; shift: string; tanggal: string }[]) {
    const supabase = await createClient();

    const { data: petugasList } = await supabase.from('profiles').select('id, email').eq('role', 'petugas');
    const { data: shiftList } = await supabase.from('shift_piket').select('id, nama_shift').eq('is_aktif', true);

    const petugasMap = new Map((petugasList ?? []).map((p) => [p.email.toLowerCase().trim(), p.id]));
    const shiftMap = new Map((shiftList ?? []).map((s) => [s.nama_shift.toLowerCase().trim(), s.id]));

    let imported = 0;
    const errors: string[] = [];

    for (const [i, row] of rows.entries()) {
        const rowNum = i + 2; // +1 header, +1 index 0-based

        if (!row.email || !row.shift || !row.tanggal) { continue; }

        const userId = petugasMap.get(row.email.toLowerCase().trim());
        const shiftId = shiftMap.get(row.shift.toLowerCase().trim());

        // Parse DD/MM/YYYY -> YYYY-MM-DD
        const [d, m, y] = row.tanggal.split('/');
        if (!d || !m || !y) { errors.push(`Baris ${rowNum}: format tanggal tidak valid (${row.tanggal})`); continue; }
        const tanggalISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        const dayOfWeek = new Date(tanggalISO).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { errors.push(`Baris ${rowNum}: ${row.tanggal} adalah akhir pekan, dilewati.`); continue; }

        if (!userId) { errors.push(`Baris ${rowNum}: petugas dengan email "${row.email}" tidak ditemukan.`); continue; }
        if (!shiftId) { errors.push(`Baris ${rowNum}: shift "${row.shift}" tidak valid.`); continue; }

        const { error } = await supabase.from('jadwal_piket').insert({ user_id: userId, shift_id: shiftId, tanggal: tanggalISO, status: 'terjadwal' });
        if (error) {
            if (error.code === '23505') errors.push(`Baris ${rowNum}: jadwal sudah ada, dilewati.`);
            else errors.push(`Baris ${rowNum}: ${error.message}`);
            continue;
        }
        imported++;
    }

    revalidatePath('/admin/jadwal');
    return { imported, skipped: rows.length - imported, errors };
}
