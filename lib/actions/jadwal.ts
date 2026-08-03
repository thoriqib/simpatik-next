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
 * Import massal jadwal dari CSV (kolom: nama_petugas, shift, tanggal DD/MM/YYYY).
 * Pengganti fitur upload Excel di versi Laravel — memakai CSV karena
 * parsing native tanpa dependency tambahan (bisa dibuka & disimpan dari Excel juga).
 */
export async function importJadwalCSV(rows: { nama: string; shift: string; tanggal: string }[]) {
    const supabase = await createClient();

    const { data: petugasList } = await supabase.from('profiles').select('id, name').eq('role', 'petugas');
    const { data: shiftList } = await supabase.from('shift_piket').select('id, nama_shift').eq('is_aktif', true);

    const petugasMap = new Map((petugasList ?? []).map((p) => [p.name.toLowerCase().trim(), p.id]));
    const shiftMap = new Map((shiftList ?? []).map((s) => [s.nama_shift.toLowerCase().trim(), s.id]));

    let imported = 0;
    const errors: string[] = [];

    for (const [i, row] of rows.entries()) {
        const rowNum = i + 2; // +1 header, +1 index 0-based
        const userId = petugasMap.get(row.nama.toLowerCase().trim());
        const shiftId = shiftMap.get(row.shift.toLowerCase().trim());

        if (!row.nama || !row.shift || !row.tanggal) { continue; }

        // Parse DD/MM/YYYY -> YYYY-MM-DD
        const [d, m, y] = row.tanggal.split('/');
        if (!d || !m || !y) { errors.push(`Baris ${rowNum}: format tanggal tidak valid (${row.tanggal})`); continue; }
        const tanggalISO = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        const dayOfWeek = new Date(tanggalISO).getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { errors.push(`Baris ${rowNum}: ${row.tanggal} adalah akhir pekan, dilewati.`); continue; }

        if (!userId) { errors.push(`Baris ${rowNum}: petugas "${row.nama}" tidak ditemukan.`); continue; }
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
