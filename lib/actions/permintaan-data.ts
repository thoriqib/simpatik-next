'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { cekDalamJamPelayanan } from '@/lib/jam-pelayanan';
import type { ActionState } from './auth';
import type { PermintaanDataPublikResult, PermintaanDataRingkasan } from '@/lib/types/database';

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
    // [FITUR BARU] Form hanya boleh diisi pada jam pelayanan — validasi
    // di SERVER (bukan cuma disembunyikan di UI), supaya tidak bisa
    // dilewati lewat request manual. UI juga menyembunyikan form di luar
    // jam ini (lihat app/(publik)/permintaan-data/page.tsx), ini lapis
    // pertahanan keduanya.
    const { dalamJam, jamMulai, jamSelesai } = await cekDalamJamPelayanan();
    if (!dalamJam) {
        return { error: `Formulir permintaan data hanya bisa diisi pada jam pelayanan (${jamMulai}–${jamSelesai} WIB). Silakan coba lagi pada jam tersebut.` };
    }

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
    // di-override lewat request yang dimanipulasi). `token` TIDAK
    // dikirim di sini — biar Postgres yang generate (gen_random_uuid()
    // default di kolom), supaya token selalu murni buatan server.
    const { data: inserted, error } = await supabase
        .from('permintaan_data')
        .insert({
            nama_lengkap: namaLengkap,
            instansi,
            kegunaan_data: kegunaanData,
            email,
            no_hp: noHp,
            kebutuhan_data: kebutuhanData,
        })
        .select('token')
        .single();

    if (error || !inserted) {
        // [DEBUG] Log detail error ke server (terlihat di log Vercel/runtime),
        // supaya penyebab sebenarnya (misal RLS policy, kolom belum ada
        // karena migration belum dijalankan) tidak "hilang" jadi pesan
        // generik ke pengguna.
        console.error('[kirimPermintaanData] Gagal insert:', error);
        return { error: 'Gagal mengirim permintaan. Silakan coba lagi beberapa saat lagi.' };
    }

    // [DIHAPUS] Pengiriman email link lewat Resend dihapus — sering gagal
    // karena akun email pihak ketiga butuh verifikasi domain (langkah
    // konfigurasi yang rentan luput/rumit), dan verifikasi domain adalah
    // syarat standar di SEMUA provider email API sejenis (bukan cuma
    // Resend), jadi ganti provider tidak akan menyelesaikan akar masalahnya.
    // Link di layar sekarang jadi SATU-SATUNYA jalur (selalu berhasil,
    // tidak bergantung pihak ketiga) — lihat LinkSuksesCard.tsx.
    revalidatePath('/admin/permintaan-data');
    redirect(`/permintaan-data?token=${inserted.token}`);
}

/**
 * Petugas mengklaim ("Tindak Lanjuti") permintaan yang masih 'baru'.
 * Penanggung jawab otomatis jadi petugas yang klik tombol ini.
 * Hanya berhasil kalau statusnya MASIH 'baru' (belum diklaim orang lain) —
 * dicek lewat .eq('status', 'baru') di query, bukan cuma di UI, supaya
 * tidak ada race condition dua petugas klaim bersamaan.
 */
export async function tindakLanjutiPermintaanData(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data, error } = await supabase
        .from('permintaan_data')
        .update({ ditangani_oleh: user.id, status: 'diproses' })
        .eq('id', id)
        .eq('status', 'baru') // guard: hanya klaim kalau belum ada yang pegang
        .select('id')
        .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: 'Permintaan ini sudah lebih dulu ditindaklanjuti petugas lain.' };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    return { success: true };
}

/**
 * Petugas lain mengambil alih permintaan yang sedang 'diproses' oleh
 * petugas sebelumnya (misal petugas sebelumnya berhalangan/tidak bisa
 * menyelesaikan). Hanya berlaku selama status masih 'diproses' — kalau
 * sudah 'selesai', tidak bisa diambil alih lagi.
 */
export async function ambilAlihPermintaanData(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data, error } = await supabase
        .from('permintaan_data')
        .update({ ditangani_oleh: user.id })
        .eq('id', id)
        .eq('status', 'diproses') // guard: cuma bisa diambil alih kalau belum selesai
        .select('id')
        .maybeSingle();

    if (error) return { error: error.message };
    if (!data) return { error: 'Permintaan ini sudah selesai, tidak bisa diambil alih lagi.' };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    return { success: true };
}

/**
 * Petugas/admin mengirim pesan di percakapan permintaan data.
 *
 * Guard keamanan: petugas HANYA boleh kirim pesan di permintaan yang
 * memang jadi tanggung jawabnya (ditangani_oleh = dirinya), dan hanya
 * kalau statusnya 'diproses' (belum selesai). Admin boleh kirim pesan
 * kapan pun kecuali sudah 'selesai' — kalau permintaan masih 'baru' dan
 * admin yang kirim pesan duluan, otomatis jadi penanggung jawabnya
 * (setara klik "Tindak Lanjuti").
 */
export async function kirimPesanPetugas(permintaanId: number, pesan: string) {
    const teks = pesan.trim();
    if (!teks) return { error: 'Pesan tidak boleh kosong.' };
    if (teks.length > 2000) return { error: 'Pesan maksimal 2000 karakter.' };

    // [FITUR BARU] Chat cuma bisa dipakai pada jam pelayanan — berlaku
    // untuk kedua sisi (staf maupun pengunjung), supaya tidak ada
    // ekspektasi percakapan aktif di luar jam kerja.
    const { dalamJam, jamMulai, jamSelesai } = await cekDalamJamPelayanan();
    if (!dalamJam) {
        return { error: `Percakapan hanya bisa diakses pada jam pelayanan (${jamMulai}–${jamSelesai} WIB).` };
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const { data: current } = await supabase.from('permintaan_data').select('status, ditangani_oleh').eq('id', permintaanId).single();

    if (!current) return { error: 'Permintaan tidak ditemukan.' };
    if (current.status === 'selesai') return { error: 'Percakapan sudah ditutup (status selesai).' };

    if (profile?.role === 'petugas') {
        if (current.status === 'baru') {
            return { error: 'Klik "Tindak Lanjuti" terlebih dahulu sebelum mengirim pesan.' };
        }
        if (current.ditangani_oleh !== user.id) {
            return { error: 'Anda bukan penanggung jawab permintaan ini. Klik "Ambil Alih" terlebih dahulu.' };
        }
    }

    const { error } = await supabase.from('permintaan_data_pesan').insert({
        permintaan_data_id: permintaanId,
        pengirim: 'petugas',
        petugas_id: user.id,
        pesan: teks,
    });
    if (error) return { error: error.message };

    // Admin kirim pesan duluan di permintaan yang masih 'baru' → otomatis jadi PJ
    if (profile?.role === 'admin' && current.status === 'baru') {
        await supabase.from('permintaan_data').update({ ditangani_oleh: user.id, status: 'diproses' }).eq('id', permintaanId);
    }

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    return { success: true };
}

/**
 * Tandai permintaan selesai — menutup percakapan (pengunjung tidak bisa
 * kirim pesan lagi setelah ini). Tidak perlu tanggapan terpisah lagi,
 * karena seluruh riwayat chat SUDAH JADI catatan tanggapannya.
 */
export async function selesaikanPermintaan(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    const { data: current } = await supabase.from('permintaan_data').select('ditangani_oleh').eq('id', id).single();

    if (profile?.role === 'petugas' && current?.ditangani_oleh !== user.id) {
        return { error: 'Anda bukan penanggung jawab permintaan ini.' };
    }

    const { error } = await supabase
        .from('permintaan_data')
        .update({ status: 'selesai', ditangani_oleh: user.id, ditanggapi_pada: new Date().toISOString() })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    revalidatePath('/admin/petugas-terbaik'); // memengaruhi skor jumlah pengunjung dilayani
    revalidatePath('/admin/laporan/layanan');
    return { success: true };
}

/**
 * Publik: ambil detail + seluruh pesan by token, lewat function
 * SECURITY DEFINER (lihat migration 0010) — TIDAK mengakses tabel
 * langsung, supaya publik tidak bisa mem-bypass token dengan query
 * manual ke permintaan_data/permintaan_data_pesan.
 */
export async function ambilPermintaanDataPublik(token: string): Promise<PermintaanDataPublikResult | null> {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_permintaan_data_publik', { p_token: token });

    if (error || !data || data.error) return null;
    return data as PermintaanDataPublikResult;
}

/**
 * Publik: cari ulang link lacak lewat email + tanggal pengajuan — untuk
 * pengguna yang lupa menyimpan link lacaknya. Hasil sengaja minimal
 * (token + ringkasan), bukan seluruh isi — cukup untuk mengenali &
 * mengarahkan ke halaman lacak yang sebenarnya.
 */
export async function cariPermintaanDataPublik(email: string): Promise<PermintaanDataRingkasan[]> {
    const emailBersih = email.trim();
    if (!emailBersih) return [];

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('cari_permintaan_data_publik', { p_email: emailBersih });

    if (error || !data) return [];
    return data as PermintaanDataRingkasan[];
}

/** Publik: kirim pesan lewat token (dipanggil dari halaman lacak, tanpa login). */
export async function kirimPesanPengunjungPublik(token: string, pesan: string) {
    const teks = pesan.trim();
    if (!teks) return { error: 'Pesan tidak boleh kosong.' };
    if (teks.length > 2000) return { error: 'Pesan maksimal 2000 karakter.' };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('kirim_pesan_pengunjung', { p_token: token, p_pesan: teks });

    if (error) return { error: 'Gagal mengirim pesan. Silakan coba lagi.' };
    if (data?.error) return { error: data.error as string };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    return { success: true };
}

/**
 * Publik: kirim penilaian untuk petugas yang menangani permintaan data
 * online, lewat token (tanpa login) — sama pola amannya dengan kirim
 * pesan, lewat function SECURITY DEFINER yang validasi status 'selesai'
 * dan mencegah dinilai dua kali.
 */
export async function kirimPenilaianPermintaanDataPublik(token: string, nilai: number, komentar: string) {
    if (!nilai || nilai < 1 || nilai > 5) return { error: 'Nilai wajib dipilih.' };
    if (komentar.length > 1000) return { error: 'Komentar maksimal 1000 karakter.' };

    const supabase = await createClient();
    const { data, error } = await supabase.rpc('kirim_penilaian_permintaan_data', {
        p_token: token,
        p_nilai: nilai,
        p_komentar: komentar,
    });

    if (error) return { error: 'Gagal mengirim penilaian. Silakan coba lagi.' };
    if (data?.error) return { error: data.error as string };

    revalidatePath('/admin/penilaian');
    revalidatePath('/admin/petugas-terbaik');
    return { success: true };
}

/**
 * Khusus admin: delegasikan penanggung jawab ke petugas tertentu tanpa
 * admin sendiri yang menanggapi. Status otomatis jadi 'diproses'.
 * Bisa dipakai kapan pun (termasuk untuk GANTI penanggung jawab yang
 * sudah ada sebelumnya) — admin punya kendali penuh.
 */
export async function delegasikanPermintaanData(id: number, petugasId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa mendelegasikan permintaan.' };

    const { error } = await supabase
        .from('permintaan_data')
        .update({ ditangani_oleh: petugasId, status: 'diproses' })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    return { success: true };
}

/**
 * Khusus admin: edit data permintaan (misal ada salah ketik dari
 * pengunjung, atau perlu koreksi data kontak).
 */
export async function editPermintaanData(id: number, prevState: ActionState, formData: FormData): Promise<ActionState> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa mengedit permintaan.' };

    const namaLengkap = (formData.get('nama_lengkap') as string || '').trim();
    const instansi = (formData.get('instansi') as string || '').trim();
    const kegunaanData = formData.get('kegunaan_data') as string;
    const email = (formData.get('email') as string || '').trim().toLowerCase();
    const noHp = (formData.get('no_hp') as string || '').trim();
    const kebutuhanData = (formData.get('kebutuhan_data') as string || '').trim();

    if (!namaLengkap || !instansi || !kegunaanData || !email || !noHp || !kebutuhanData) {
        return { error: 'Semua field wajib diisi.' };
    }
    if (!EMAIL_REGEX.test(email)) return { error: 'Format email tidak valid.' };
    if (!PHONE_REGEX.test(noHp)) return { error: 'Format nomor HP tidak valid.' };
    if (kegunaanData !== 'kedinasan' && kegunaanData !== 'pribadi') return { error: 'Kegunaan data tidak valid.' };
    if (namaLengkap.length > MAX_LEN.nama_lengkap) return { error: `Nama lengkap maksimal ${MAX_LEN.nama_lengkap} karakter.` };
    if (instansi.length > MAX_LEN.instansi) return { error: `Instansi maksimal ${MAX_LEN.instansi} karakter.` };
    if (kebutuhanData.length > MAX_LEN.kebutuhan_data) return { error: `Uraian kebutuhan data maksimal ${MAX_LEN.kebutuhan_data} karakter.` };

    const { error } = await supabase
        .from('permintaan_data')
        .update({
            nama_lengkap: namaLengkap,
            instansi,
            kegunaan_data: kegunaanData,
            email,
            no_hp: noHp,
            kebutuhan_data: kebutuhanData,
        })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    redirect(`/admin/permintaan-data/${id}`);
}

/**
 * Khusus admin: batalkan penyelesaian (misal petugas salah menyelesaikan
 * atau tanggapannya keliru). Status DIKEMBALIKAN ke 'diproses' (bukan
 * status terpisah "dibatalkan") — supaya permintaan otomatis balik ke
 * antrian kerja petugas dan bisa ditanggapi ulang, bukan jadi "mati"
 * di status baru yang tidak ada tindak lanjutnya.
 */
export async function batalkanPermintaanData(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa membatalkan penyelesaian.' };

    const { error } = await supabase
        .from('permintaan_data')
        .update({ status: 'diproses', tanggapan: null, ditanggapi_pada: null })
        .eq('id', id);

    if (error) return { error: error.message };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    revalidatePath('/admin/petugas-terbaik');
    revalidatePath('/admin/laporan/layanan');
    return { success: true };
}

/** Khusus admin: hapus permanen permintaan data (misal spam/salah kirim). */
export async function hapusPermintaanData(id: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa menghapus permintaan.' };

    const { error } = await supabase.from('permintaan_data').delete().eq('id', id);
    if (error) return { error: error.message };

    revalidatePath('/admin/permintaan-data');
    revalidatePath('/petugas/permintaan-data');
    revalidatePath('/admin/petugas-terbaik');
    redirect('/admin/permintaan-data');
}
