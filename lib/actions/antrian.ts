'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

/**
 * Ambil nomor antrian — memanggil RPC function `ambil_nomor_antrian`
 * di database (atomic, aman dari race condition nomor ganda).
 * Setara AntrianPublikController@ambil di Laravel.
 */
export async function ambilAntrian(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const jenisLayananId = Number(formData.get('jenis_layanan_id'));
    const nama = formData.get('nama_pengunjung') as string;
    const noHp = (formData.get('no_hp') as string) || null;
    const email = (formData.get('email') as string) || null;

    if (!jenisLayananId || !nama) {
        return { error: 'Jenis layanan dan nama wajib diisi.' };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('ambil_nomor_antrian', {
        p_jenis_layanan_id: jenisLayananId,
        p_nama: nama,
        p_no_hp: noHp,
        p_email: email,
    });

    if (error) {
        return { error: 'Gagal mengambil nomor antrian: ' + error.message };
    }

    redirect(`/antrian/${data.kode_antrian}/tiket`);
}

/** Petugas memanggil antrian */
export async function panggilAntrian(antrianId: number, petugasId: string) {
    const supabase = await createClient();
    await supabase
        .from('antrian')
        .update({ status: 'dipanggil', petugas_id: petugasId, waktu_panggil: new Date().toISOString() })
        .eq('id', antrianId);
    revalidatePath('/petugas/dashboard');
    revalidatePath('/display-antrian');
}

export async function mulaiLayaniAntrian(antrianId: number) {
    const supabase = await createClient();
    await supabase
        .from('antrian')
        .update({ status: 'dilayani', waktu_mulai_layanan: new Date().toISOString() })
        .eq('id', antrianId);
    revalidatePath('/petugas/dashboard');
    revalidatePath('/display-antrian');
}

export async function selesaiAntrian(antrianId: number) {
    const supabase = await createClient();
    await supabase
        .from('antrian')
        .update({ status: 'selesai', waktu_selesai: new Date().toISOString() })
        .eq('id', antrianId);
    revalidatePath('/petugas/dashboard');
    revalidatePath('/display-antrian');
}

export async function batalAntrian(antrianId: number) {
    const supabase = await createClient();
    await supabase.from('antrian').update({ status: 'batal' }).eq('id', antrianId);
    revalidatePath('/petugas/dashboard');
    revalidatePath('/display-antrian');
}
