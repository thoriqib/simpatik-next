'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { formatInTimeZone } from 'date-fns-tz';
import { jadwalPelayananHariIni } from '@/lib/jam-pelayanan';
import type { ActionState } from './auth';

/**
 * Ambil nomor antrian — memanggil RPC function `ambil_nomor_antrian`
 * di database (atomic, aman dari race condition nomor ganda).
 * Setara AntrianPublikController@ambil di Laravel.
 */
export async function ambilAntrian(prevState: ActionState, formData: FormData): Promise<ActionState> {
    // [FIX KEAMANAN] Validasi jam blokir keras di SERVER, bukan cuma popup
    // di client — client-side check bisa dilewati siapa saja lewat
    // devtools/request manual. Ini pertahanan berlapis, bukan satu-satunya
    // lapisan (UI juga menyembunyikan form di jam ini).
    const jadwal = jadwalPelayananHariIni();
    if (!jadwal.buka) {
        return { error: 'Tidak ada pelayanan pada hari Sabtu & Minggu. Silakan kembali pada hari kerja mulai pukul 08.00 WIB.' };
    }
    const jamWIB = Number(formatInTimeZone(new Date(), 'Asia/Jakarta', 'H'));
    if (jamWIB >= 18 || jamWIB < 7) {
        return { error: 'Pengambilan nomor antrian ditutup pukul 18.00–07.00 WIB. Silakan coba lagi besok pagi.' };
    }

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

    redirect(`/antrian/${data.kode_antrian}/tiket?cetak=1`);
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

/**
 * Catat kunjungan Mitra Statistik — TIDAK melalui alur antrian biasa
 * (tanpa nomor urut, tanpa status layanan, tanpa penilaian). Cukup
 * catat nama, no HP, keperluan. Tetap dibatasi jam pelayanan yang sama
 * dengan antrian (Mitra Statistik tetap kunjungan fisik ke kantor).
 */
export async function catatKunjunganMitra(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const jadwal = jadwalPelayananHariIni();
    if (!jadwal.buka) {
        return { error: 'Tidak ada pelayanan pada hari Sabtu & Minggu. Silakan kembali pada hari kerja mulai pukul 08.00 WIB.' };
    }
    const jamWIB = Number(formatInTimeZone(new Date(), 'Asia/Jakarta', 'H'));
    if (jamWIB >= 18 || jamWIB < 7) {
        return { error: 'Pencatatan kunjungan ditutup pukul 18.00–07.00 WIB. Silakan coba lagi besok pagi.' };
    }

    const nama = (formData.get('nama') as string || '').trim();
    const noHp = (formData.get('no_hp') as string || '').trim();
    const keperluan = (formData.get('keperluan') as string || '').trim();

    if (!nama || !noHp || !keperluan) {
        return { error: 'Nama, no. HP, dan keperluan wajib diisi.' };
    }
    if (nama.length > 150) return { error: 'Nama maksimal 150 karakter.' };
    if (noHp.length > 20) return { error: 'No. HP maksimal 20 karakter.' };
    if (keperluan.length > 500) return { error: 'Keperluan maksimal 500 karakter.' };

    const supabase = await createClient();
    const { error } = await supabase.from('kunjungan_mitra').insert({ nama, no_hp: noHp, keperluan });

    if (error) {
        console.error('[catatKunjunganMitra] Gagal insert:', error);
        return { error: 'Gagal mencatat kunjungan. Silakan coba lagi.' };
    }

    revalidatePath('/admin/kunjungan-mitra');
    revalidatePath('/petugas/kunjungan-mitra');
    redirect('/antrian?mitra=sukses');
}

/** Khusus admin: hapus data kunjungan Mitra Statistik yang keliru diinput. */
export async function hapusKunjunganMitra(id: number) {
    const supabase = await createClient();
    await supabase.from('kunjungan_mitra').delete().eq('id', id);
    revalidatePath('/admin/kunjungan-mitra');
    revalidatePath('/petugas/kunjungan-mitra');
}
