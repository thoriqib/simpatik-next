'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

export async function saveShift(id: number | null, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const nama_shift = formData.get('nama_shift') as string;
    const jam_mulai = formData.get('jam_mulai') as string;
    const jam_selesai = formData.get('jam_selesai') as string;
    const is_aktif = formData.get('is_aktif') === 'on';

    if (jam_selesai <= jam_mulai) {
        return { error: 'Jam selesai harus setelah jam mulai.' };
    }

    const supabase = await createClient();
    const payload = { nama_shift, jam_mulai, jam_selesai, is_aktif };

    const { error } = id
        ? await supabase.from('shift_piket').update(payload).eq('id', id)
        : await supabase.from('shift_piket').insert(payload);

    if (error) return { error: error.message };

    revalidatePath('/admin/shift');
    return null;
}

export async function toggleShift(id: number, current: boolean) {
    const supabase = await createClient();
    await supabase.from('shift_piket').update({ is_aktif: !current }).eq('id', id);
    revalidatePath('/admin/shift');
}

export async function deleteShift(id: number) {
    const supabase = await createClient();

    const { count } = await supabase
        .from('jadwal_piket')
        .select('*', { count: 'exact', head: true })
        .eq('shift_id', id)
        .gte('tanggal', new Date().toISOString().slice(0, 10));

    if (count && count > 0) {
        return { error: 'Shift tidak dapat dihapus karena masih dipakai di jadwal mendatang.' };
    }

    await supabase.from('shift_piket').delete().eq('id', id);
    revalidatePath('/admin/shift');
    return null;
}
