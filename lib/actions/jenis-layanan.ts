'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

export async function saveJenisLayanan(id: number | null, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const kode = (formData.get('kode') as string).toUpperCase();
    const nama_layanan = formData.get('nama_layanan') as string;
    const deskripsi = (formData.get('deskripsi') as string) || null;
    const is_aktif = formData.get('is_aktif') === 'on';

    const supabase = await createClient();
    const payload = { kode, nama_layanan, deskripsi, is_aktif };

    const { error } = id
        ? await supabase.from('jenis_layanan').update(payload).eq('id', id)
        : await supabase.from('jenis_layanan').insert(payload);

    if (error) {
        return { error: error.code === '23505' ? 'Kode sudah dipakai jenis layanan lain.' : error.message };
    }

    revalidatePath('/admin/jenis-layanan');
    revalidatePath('/');
    return null;
}

export async function deleteJenisLayanan(id: number) {
    const supabase = await createClient();

    const { count } = await supabase.from('antrian').select('*', { count: 'exact', head: true }).eq('jenis_layanan_id', id);
    if (count && count > 0) {
        return { error: 'Jenis layanan tidak dapat dihapus karena sudah memiliki data antrian.' };
    }

    await supabase.from('jenis_layanan').delete().eq('id', id);
    revalidatePath('/admin/jenis-layanan');
    return null;
}
