'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { normalisasiNomorWa } from '@/lib/nomor-wa';

/**
 * Khusus admin: simpan nomor WhatsApp banyak petugas sekaligus.
 * Baris kosong = hapus nomor (petugas tidak dikirimi pengingat).
 * Semua baris divalidasi DULU — kalau ada yang tidak valid, tidak ada
 * yang disimpan, supaya admin memperbaiki lalu simpan sekali lagi.
 */
export async function simpanNomorWa(rows: { id: string; noHp: string }[]): Promise<{ error?: string; success?: string; salah?: string[] }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa mengubah nomor WhatsApp.' };

    const siap: { id: string; no_hp: string | null }[] = [];
    const salah: string[] = [];
    for (const r of rows) {
        const n = normalisasiNomorWa(r.noHp ?? '');
        if (n === undefined) salah.push(r.id);
        else siap.push({ id: r.id, no_hp: n });
    }
    if (salah.length > 0) return { error: `${salah.length} nomor tidak valid. Gunakan nomor seluler Indonesia, contoh 0812 3456 7890.`, salah };

    // Update per baris (bukan upsert) supaya kolom lain di profiles tidak tersentuh
    const hasil = await Promise.all(siap.map((r) => supabase.from('profiles').update({ no_hp: r.no_hp }).eq('id', r.id)));
    const gagal = hasil.find((h) => h.error);
    if (gagal?.error) return { error: `Gagal menyimpan: ${gagal.error.message}` };

    revalidatePath('/admin/nomor-wa');
    const terisi = siap.filter((r) => r.no_hp).length;
    return { success: `Tersimpan. ${terisi} dari ${siap.length} petugas punya nomor WhatsApp.` };
}
