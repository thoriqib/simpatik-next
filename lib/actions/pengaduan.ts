'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

/** Pengaduan bersifat ANONIM — tidak menyimpan identitas pelapor. */
export async function kirimPengaduan(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const subjek = formData.get('subjek') as string;
    const isi = formData.get('isi_pengaduan') as string;

    if (!subjek || !isi) {
        return { error: 'Subjek dan isi pengaduan wajib diisi.' };
    }

    const supabase = await createClient();

    const { error } = await supabase.from('pengaduan').insert({
        subjek,
        isi_pengaduan: isi,
    });

    if (error) return { error: error.message };

    revalidatePath('/admin/pengaduan');
    // [FIX] Sebelumnya redirect ke '/?pengaduan=sukses' — tapi '/' sekarang
    // landing page yang tidak pernah menangani parameter itu (bahkan
    // sebelumnya juga tidak ditangani), jadi pesan sukses tidak pernah
    // benar-benar tampil. Sekarang redirect ke halaman pengaduan itu
    // sendiri dengan parameter yang DITANGANI (lihat page.tsx).
    redirect('/pengaduan?sukses=1');
}

export async function tanggapiPengaduan(id: number, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const tanggapan = formData.get('tanggapan') as string;
    const status = formData.get('status') as string;

    if (!tanggapan || tanggapan.length < 10) {
        return { error: 'Tanggapan minimal 10 karakter.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('pengaduan')
        .update({
            tanggapan,
            status,
            ditangani_oleh: user!.id,
            ditanggapi_pada: status === 'selesai' ? new Date().toISOString() : null,
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/pengaduan');
    redirect('/admin/pengaduan');
}
