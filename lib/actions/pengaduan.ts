'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cekDalamJamPelayanan } from '@/lib/jam-pelayanan';
import type { ActionState } from './auth';
import type { PengaduanPublikResult } from '@/lib/types/database';

/**
 * Pengaduan bersifat ANONIM — tidak menyimpan identitas pelapor sama
 * sekali, termasuk TIDAK meminta email (beda dengan permintaan data
 * online). Token akses ditampilkan HANYA di layar setelah kirim —
 * pengadu wajib menyimpan link itu sendiri untuk memantau/melanjutkan
 * percakapan. Pengiriman pengaduan sendiri TIDAK dibatasi jam pelayanan
 * (orang boleh mengadu kapan saja) — yang dibatasi jam pelayanan cuma
 * percakapan chat-nya (lihat kirimPesanPenguduPublik & kirimPesanAdminPengaduan).
 */
export async function kirimPengaduan(prevState: ActionState, formData: FormData): Promise<ActionState> {
    const subjek = (formData.get('subjek') as string || '').trim();
    const isi = (formData.get('isi_pengaduan') as string || '').trim();

    if (!subjek || !isi) {
        return { error: 'Subjek dan isi pengaduan wajib diisi.' };
    }
    if (subjek.length > 200) return { error: 'Subjek maksimal 200 karakter.' };
    if (isi.length > 2000) return { error: 'Isi pengaduan maksimal 2000 karakter.' };

    const supabase = await createClient();

    const { data: inserted, error } = await supabase
        .from('pengaduan')
        .insert({ subjek, isi_pengaduan: isi })
        .select('token')
        .single();

    if (error || !inserted) {
        // [DEBUG] Log detail error ke server (terlihat di log Vercel/runtime),
        // supaya penyebab sebenarnya (misal kolom belum ada karena migration
        // belum dijalankan) tidak "hilang" jadi pesan generik ke pengguna.
        console.error('[kirimPengaduan] Gagal insert:', error);
        return { error: 'Gagal mengirim pengaduan. Silakan coba lagi. Jika masalah berlanjut, hubungi admin.' };
    }

    revalidatePath('/admin/pengaduan');
    redirect(`/pengaduan?token=${inserted.token}`);
}

/** Publik: ambil detail pengaduan + riwayat chat lewat token (tanpa login). */
export async function ambilPengaduanPublik(token: string): Promise<PengaduanPublikResult | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_pengaduan_publik', { p_token: token });

    if (error || !data || data.error) return null;
    return data as PengaduanPublikResult;
}

/**
 * Khusus admin: kirim pesan balasan ke pengadu lewat chat. Pesan
 * pertama otomatis memindahkan status 'baru' → 'diproses' (membuka
 * chat untuk pengadu), sama pola auto-klaimnya dengan permintaan data.
 */
export async function kirimPesanAdminPengaduan(pengaduanId: number, pesan: string) {
    const teks = pesan.trim();
    if (!teks) return { error: 'Pesan tidak boleh kosong.' };
    if (teks.length > 2000) return { error: 'Pesan maksimal 2000 karakter.' };

    const { dalamJam, jamMulai, jamSelesai } = await cekDalamJamPelayanan();
    if (!dalamJam) {
        return { error: `Percakapan hanya bisa diakses pada jam pelayanan (${jamMulai}–${jamSelesai} WIB).` };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: pengaduan } = await supabase.from('pengaduan').select('status').eq('id', pengaduanId).single();
    if (!pengaduan) return { error: 'Pengaduan tidak ditemukan.' };
    if (pengaduan.status === 'selesai') return { error: 'Pengaduan ini sudah ditandai selesai.' };

    const { error: errorPesan } = await supabase.from('pengaduan_pesan').insert({
        pengaduan_id: pengaduanId,
        pengirim: 'petugas',
        petugas_id: user.id,
        pesan: teks,
    });
    if (errorPesan) return { error: errorPesan.message };

    // Pesan pertama dari admin otomatis buka chat (baru → diproses)
    if (pengaduan.status === 'baru') {
        await supabase.from('pengaduan').update({ status: 'diproses', ditangani_oleh: user.id }).eq('id', pengaduanId);
    }

    revalidatePath('/admin/pengaduan');
    revalidatePath(`/admin/pengaduan/${pengaduanId}`);
    return { success: true };
}

/** Publik: kirim pesan dari pengadu lewat token (tanpa login). */
export async function kirimPesanPenguduPublik(token: string, pesan: string) {
    const teks = pesan.trim();
    if (!teks) return { error: 'Pesan tidak boleh kosong.' };
    if (teks.length > 2000) return { error: 'Pesan maksimal 2000 karakter.' };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('kirim_pesan_pengadu', { p_token: token, p_pesan: teks });

    if (error) return { error: 'Gagal mengirim pesan. Silakan coba lagi.' };
    if (data?.error) return { error: data.error as string };

    revalidatePath('/admin/pengaduan');
    return { success: true };
}

/** Khusus admin: tandai pengaduan selesai — menutup chat. */
export async function selesaikanPengaduan(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { error } = await supabase
        .from('pengaduan')
        .update({ status: 'selesai', ditangani_oleh: user.id, ditanggapi_pada: new Date().toISOString() })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/pengaduan');
    revalidatePath(`/admin/pengaduan/${id}`);
    return { success: true };
}
