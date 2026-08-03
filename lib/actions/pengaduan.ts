'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

/** Pengaduan bersifat ANONIM — tidak menyimpan identitas pelapor. */
export async function kirimPengaduan(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const subjek = formData.get('subjek') as string;
    const isi = formData.get('isi_pengaduan') as string;
    const file = formData.get('lampiran') as File | null;

    if (!subjek || !isi) {
        return { error: 'Subjek dan isi pengaduan wajib diisi.' };
    }

    const supabase = await createClient();
    let lampiranPath: string | null = null;

    if (file && file.size > 0) {
        if (file.size > 2 * 1024 * 1024) {
            return { error: 'Lampiran maksimal 2MB.' };
        }
        const ext = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadError } = await supabase.storage.from('pengaduan').upload(fileName, file);
        if (uploadError) {
            return { error: 'Gagal mengunggah lampiran: ' + uploadError.message };
        }
        lampiranPath = fileName;
    }

    const { error } = await supabase.from('pengaduan').insert({
        subjek,
        isi_pengaduan: isi,
        lampiran_path: lampiranPath,
    });

    if (error) return { error: error.message };

    revalidatePath('/admin/pengaduan');
    redirect('/?pengaduan=sukses');
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
