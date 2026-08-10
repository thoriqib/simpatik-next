'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ActionState } from './auth';

// ═══════════════════════════════════════════════════════════════
// Validasi input — form ini diisi PUBLIK tanpa login, jadi semua
// input harus divalidasi ketat di server (jangan pernah percaya
// input dari client, siapa pun bisa mem-bypass validasi HTML/JS).
// ═══════════════════════════════════════════════════════════════

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{8,20}$/; // digit, +, -, spasi, kurung — panjang wajar nomor HP

// Batas panjang teks — cegah payload raksasa yang bisa membebani DB/pemakaian storage
const MAX_LEN = {
    nama_lengkap: 150,
    instansi: 150,
    email: 150,
    no_hp: 20,
    kebutuhan_data: 2000,
};

export async function kirimPermintaanData(prevState: ActionState, formData: FormData): Promise<ActionState> {
    // ── Honeypot anti-bot ──────────────────────────────────────
    // Field tersembunyi (tidak terlihat manusia, cuma bot pengisi form
    // otomatis yang biasanya isi SEMUA field). Kalau field ini terisi,
    // diam-diam tolak tanpa kasih tahu detail (jangan bocorkan mekanisme
    // deteksinya ke calon penyerang).
    if ((formData.get('website') as string)?.trim()) {
        return { error: 'Terjadi kesalahan. Silakan coba lagi.' };
    }

    const namaLengkap = (formData.get('nama_lengkap') as string || '').trim();
    const instansi = (formData.get('instansi') as string || '').trim();
    const kegunaanData = formData.get('kegunaan_data') as string;
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const noHp = (formData.get('no_hp') as string || '').trim();
    const kebutuhanData = (formData.get('kebutuhan_data') as string || '').trim();

    // ── Validasi wajib isi ────────────────────────────────────
    if (!namaLengkap || !instansi || !kegunaanData || !email || !noHp || !kebutuhanData) {
        return { error: 'Semua field wajib diisi.' };
    }

    // ── Validasi format ───────────────────────────────────────
    if (!EMAIL_REGEX.test(email)) {
        return { error: 'Format email tidak valid.' };
    }
    if (!PHONE_REGEX.test(noHp)) {
        return { error: 'Format nomor HP tidak valid (gunakan angka, 8-20 karakter).' };
    }
    if (kegunaanData !== 'kedinasan' && kegunaanData !== 'pribadi') {
        return { error: 'Kegunaan data tidak valid.' };
    }

    // ── Validasi panjang — cegah payload berlebihan ───────────
    if (namaLengkap.length > MAX_LEN.nama_lengkap) return { error: `Nama lengkap maksimal ${MAX_LEN.nama_lengkap} karakter.` };
    if (instansi.length > MAX_LEN.instansi) return { error: `Instansi maksimal ${MAX_LEN.instansi} karakter.` };
    if (email.length > MAX_LEN.email) return { error: `Email maksimal ${MAX_LEN.email} karakter.` };
    if (noHp.length > MAX_LEN.no_hp) return { error: `Nomor HP maksimal ${MAX_LEN.no_hp} karakter.` };
    if (kebutuhanData.length > MAX_LEN.kebutuhan_data) return { error: `Uraian kebutuhan data maksimal ${MAX_LEN.kebutuhan_data} karakter.` };

    const supabase = await createClient();

    // Hanya kirim field yang memang dimaksudkan untuk diisi publik —
    // TIDAK PERNAH menyertakan `status`, `ditangani_oleh`, `tanggapan`
    // dari input form (meski RLS sudah membatasi publik hanya bisa
    // INSERT, defense-in-depth: jangan beri kesempatan field itu
    // di-override lewat request yang dimanipulasi).
    const { error } = await supabase.from('permintaan_data').insert({
        nama_lengkap: namaLengkap,
        instansi,
        kegunaan_data: kegunaanData,
        email,
        no_hp: noHp,
        kebutuhan_data: kebutuhanData,
    });

    if (error) {
        return { error: 'Gagal mengirim permintaan. Silakan coba lagi beberapa saat lagi.' };
    }

    revalidatePath('/admin/permintaan-data');
    redirect('/permintaan-data?sukses=1');
}

export async function tanggapiPermintaanData(id: number, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const tanggapan = (formData.get('tanggapan') as string || '').trim();
    const status = formData.get('status') as string;

    if (!tanggapan || tanggapan.length < 5) {
        return { error: 'Tanggapan minimal 5 karakter.' };
    }
    if (tanggapan.length > 2000) {
        return { error: 'Tanggapan maksimal 2000 karakter.' };
    }
    if (!['diproses', 'selesai'].includes(status)) {
        return { error: 'Status tidak valid.' };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase
        .from('permintaan_data')
        .update({
            tanggapan,
            status,
            ditangani_oleh: user!.id,
            ditanggapi_pada: status === 'selesai' ? new Date().toISOString() : null,
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/permintaan-data');
    redirect('/admin/permintaan-data');
}
