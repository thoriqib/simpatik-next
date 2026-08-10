'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function tambahHariLibur(tanggal: string, keterangan: string) {
    if (!tanggal || !keterangan.trim()) {
        return { error: 'Tanggal dan keterangan wajib diisi.' };
    }

    const supabase = await createClient();
    const { error } = await supabase.from('hari_libur').insert({ tanggal, keterangan: keterangan.trim() });

    if (error) {
        return { error: error.code === '23505' ? 'Tanggal ini sudah ditandai sebagai hari libur.' : error.message };
    }

    revalidatePath('/admin/jadwal');
    revalidatePath('/jadwal-petugas');
    return { success: true };
}

export async function hapusHariLibur(id: number) {
    const supabase = await createClient();
    await supabase.from('hari_libur').delete().eq('id', id);

    revalidatePath('/admin/jadwal');
    revalidatePath('/jadwal-petugas');
}
