'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { ActionState } from './auth';

const MAX_LEN = { judul: 150, deskripsi: 300, url: 500 };

function validasi(judul: string, deskripsi: string, url: string): string | null {
    if (!judul || !deskripsi || !url) return 'Judul, deskripsi, dan link wajib diisi.';
    if (judul.length > MAX_LEN.judul) return `Judul maksimal ${MAX_LEN.judul} karakter.`;
    if (deskripsi.length > MAX_LEN.deskripsi) return `Deskripsi maksimal ${MAX_LEN.deskripsi} karakter.`;
    if (url.length > MAX_LEN.url) return `Link maksimal ${MAX_LEN.url} karakter.`;
    if (!/^https?:\/\//.test(url)) return 'Link harus diawali http:// atau https://';
    return null;
}

export async function tambahLinkPestaKoja(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const judul = (formData.get('judul') as string || '').trim();
    const deskripsi = (formData.get('deskripsi') as string || '').trim();
    const url = (formData.get('url') as string || '').trim();
    const ikon = (formData.get('ikon') as string || 'link').trim();

    const errorValidasi = validasi(judul, deskripsi, url);
    if (errorValidasi) return { error: errorValidasi };

    const supabase = await createClient();

    // Urutan baru otomatis ditaruh di akhir daftar
    const { data: existing } = await supabase.from('pesta_koja_link').select('urutan').order('urutan', { ascending: false }).limit(1);
    const urutanBaru = (existing?.[0]?.urutan ?? 0) + 1;

    const { error } = await supabase.from('pesta_koja_link').insert({ judul, deskripsi, url, ikon, urutan: urutanBaru });
    if (error) return { error: error.code === '23505' ? 'Judul ini sudah dipakai link lain.' : error.message };

    revalidatePath('/admin/pesta-koja');
    revalidatePath('/pesta-koja');
    redirect('/admin/pesta-koja');
}

export async function editLinkPestaKoja(id: number, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const judul = (formData.get('judul') as string || '').trim();
    const deskripsi = (formData.get('deskripsi') as string || '').trim();
    const url = (formData.get('url') as string || '').trim();
    const ikon = (formData.get('ikon') as string || 'link').trim();

    const errorValidasi = validasi(judul, deskripsi, url);
    if (errorValidasi) return { error: errorValidasi };

    const supabase = await createClient();
    const { error } = await supabase.from('pesta_koja_link').update({ judul, deskripsi, url, ikon }).eq('id', id);
    if (error) return { error: error.code === '23505' ? 'Judul ini sudah dipakai link lain.' : error.message };

    revalidatePath('/admin/pesta-koja');
    revalidatePath('/pesta-koja');
    redirect('/admin/pesta-koja');
}

export async function hapusLinkPestaKoja(id: number) {
    const supabase = await createClient();
    await supabase.from('pesta_koja_link').delete().eq('id', id);
    revalidatePath('/admin/pesta-koja');
    revalidatePath('/pesta-koja');
}

export async function ubahAktifLinkPestaKoja(id: number, isAktif: boolean) {
    const supabase = await createClient();
    await supabase.from('pesta_koja_link').update({ is_aktif: isAktif }).eq('id', id);
    revalidatePath('/admin/pesta-koja');
    revalidatePath('/pesta-koja');
}

/** Tukar posisi urutan dengan tetangga (naik = tukar dengan yang di atasnya, turun = dengan yang di bawahnya). */
export async function ubahUrutanLinkPestaKoja(id: number, arah: 'naik' | 'turun') {
    const supabase = await createClient();

    const { data: semua } = await supabase.from('pesta_koja_link').select('id, urutan').order('urutan');
    if (!semua) return;

    const idx = semua.findIndex((l) => l.id === id);
    if (idx === -1) return;

    const idxTetangga = arah === 'naik' ? idx - 1 : idx + 1;
    if (idxTetangga < 0 || idxTetangga >= semua.length) return; // sudah di ujung, tidak ada yang ditukar

    const a = semua[idx];
    const b = semua[idxTetangga];

    await supabase.from('pesta_koja_link').update({ urutan: b.urutan }).eq('id', a.id);
    await supabase.from('pesta_koja_link').update({ urutan: a.urutan }).eq('id', b.id);

    revalidatePath('/admin/pesta-koja');
    revalidatePath('/pesta-koja');
}
