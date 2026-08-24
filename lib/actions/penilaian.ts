'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

export async function kirimPenilaian(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const antrianId = Number(formData.get('antrian_id'));
    const petugasId = formData.get('petugas_id') as string;
    const nilai = Number(formData.get('nilai'));
    const komentar = (formData.get('komentar') as string) || null;

    if (!nilai || nilai < 1 || nilai > 5) {
        return { error: 'Nilai wajib dipilih.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('penilaian').insert({
        antrian_id: antrianId,
        petugas_id: petugasId,
        nilai,
        komentar,
    });

    if (error) {
        // [DEBUG] Log detail error ke server — konsisten dengan logging
        // yang ditambahkan di kirimPengaduan & kirimPermintaanData.
        console.error('[kirimPenilaian] Gagal insert:', error);
        return { error: error.code === '23505' ? 'Antrian ini sudah dinilai.' : error.message };
    }

    revalidatePath('/admin/penilaian');
    revalidatePath('/admin/petugas-terbaik');
    // [FIX] Sebelumnya redirect ke '/?penilaian=sukses' — '/' sekarang landing
    // page yang tidak menangani parameter itu (pesan sukses tidak pernah
    // tampil). Redirect ke halaman penilaian itu sendiri dengan parameter
    // yang benar-benar ditangani.
    redirect(`/penilaian/${formData.get('kode_antrian')}?sukses=1`);
}

export async function hapusPenilaian(id: number) {
    const supabase = await createClient();
    await supabase.from('penilaian').delete().eq('id', id);
    revalidatePath('/admin/penilaian');
    revalidatePath('/admin/petugas-terbaik');
}
