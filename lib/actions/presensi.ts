'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { nowWIB } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';

const TZ = 'Asia/Jakarta';

/** Menit AKTUAL setelah BATAS, di-clamp ke 0 (dipakai untuk keterlambatan masuk). */
function menitSetelah(batas: Date, aktual: Date): number {
    return Math.max(0, Math.round((aktual.getTime() - batas.getTime()) / 60000));
}

/** Menit AKTUAL sebelum BATAS, di-clamp ke 0 (dipakai untuk pulang lebih awal). */
function menitSebelum(batas: Date, aktual: Date): number {
    return Math.max(0, Math.round((batas.getTime() - aktual.getTime()) / 60000));
}

/**
 * Bangun objek Date untuk jam tertentu ("HH:MM" atau "HH:MM:SS") pada
 * tanggal yang sama dengan `acuan`.
 */
function jamPada(acuan: Date, jamStr: string): Date {
    const [h, m] = jamStr.split(':').map(Number);
    const hasil = new Date(acuan);
    hasil.setHours(h, m, 0, 0);
    return hasil;
}

/** Bentuk hasil konsisten untuk presensiMasuk/presensiKeluar — `data` selalu
 * ada di tipe (walau opsional), supaya client bisa akses `res.data` dengan
 * aman tanpa TypeScript menolak di jalur return yang tidak menyertakannya. */
type PresensiActionResult = {
    error?: string;
    warning?: string;
    success?: string;
    info?: string;
    data?: { id: number; waktu_masuk?: string; terlambat_menit?: number; waktu_keluar?: string; pulang_awal_menit?: number; kekurangan_menit?: number };
};

/**
 * Presensi masuk. Keterlambatan dihitung & DISIMPAN LANGSUNG saat ini
 * (bukan cuma ditampilkan sekali di pesan toast) — supaya tetap akurat
 * dan konsisten dipakai ulang oleh laporan kapan pun, bukan cuma saat
 * momen presensi terjadi.
 */
export async function presensiMasuk(jadwalPiketId: number): Promise<PresensiActionResult> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    // Cegah presensi masuk ganda
    const { data: existing } = await supabase
        .from('presensi')
        .select('id, waktu_masuk')
        .eq('jadwal_piket_id', jadwalPiketId)
        .maybeSingle();

    if (existing?.waktu_masuk) {
        return { info: 'Anda sudah melakukan presensi masuk hari ini.' };
    }

    const { data: jadwalRaw } = await supabase
        .from('jadwal_piket')
        .select('*, shift_piket(*)')
        .eq('id', jadwalPiketId)
        .single();

    // [FIX] Cast eksplisit — relasi to-one `shift_piket` ditebak sebagai
    // array tanpa generated types.
    const jadwal = jadwalRaw as unknown as { user_id: string; shift_piket: { jam_mulai: string; jam_selesai: string } } | null;

    if (!jadwal || jadwal.user_id !== user.id) {
        return { error: 'Jadwal tidak ditemukan atau bukan milik Anda.' };
    }

    const waktuMasuk = nowWIB();
    const waktuMasukISO = new Date().toISOString(); // simpan UTC di DB, tampilan selalu diformat ke WIB

    // ── Hitung keterlambatan (di-clamp ke 0, tidak bisa negatif) ────
    const batasMulai = jamPada(waktuMasuk, jadwal.shift_piket.jam_mulai);
    const terlambatMenit = menitSetelah(batasMulai, waktuMasuk);

    let presensiId: number;

    if (existing) {
        const { error } = await supabase.from('presensi').update({ waktu_masuk: waktuMasukISO, terlambat_menit: terlambatMenit }).eq('id', existing.id);
        // [FIX] Sebelumnya error dari update/insert ini TIDAK dicek — kalau
        // gagal (misal kolom terlambat_menit belum ada karena migration
        // 0004_presensi_detail.sql belum dijalankan di Supabase), presensi
        // tidak pernah benar-benar tersimpan tapi UI tetap menampilkan
        // "berhasil". Sekarang errornya ditangkap & ditampilkan eksplisit.
        if (error) return { error: `Gagal menyimpan presensi masuk: ${error.message}` };
        presensiId = existing.id;
    } else {
        // [FIX] .select().single() supaya dapat ID baris yang baru dibuat —
        // dibutuhkan client untuk memanggil presensiKeluar() nanti TANPA
        // perlu reload dulu (lihat PresensiPanel.tsx: presensi.id dipakai
        // langsung dari state lokal, bukan nunggu refetch).
        const { data: inserted, error } = await supabase.from('presensi').insert({
            user_id: user.id,
            jadwal_piket_id: jadwalPiketId,
            waktu_masuk: waktuMasukISO,
            terlambat_menit: terlambatMenit,
        }).select('id').single();
        if (error) return { error: `Gagal menyimpan presensi masuk: ${error.message}` };
        presensiId = inserted!.id;
    }

    await supabase.from('jadwal_piket').update({ status: 'hadir' }).eq('id', jadwalPiketId);

    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');

    const jamStr = formatInTimeZone(waktuMasukISO, TZ, 'HH:mm');

    // [FIX BUG PRESENSI] Sertakan data mentah hasil presensi (bukan cuma
    // pesan teks) supaya UI client bisa update tampilan LANGSUNG dari
    // respons ini — TANPA bergantung pada refetch/reload apa pun, yang
    // terbukti berulang kali tidak selalu andal di kondisi tertentu
    // (caching Next.js/Vercel yang sulit dipastikan penyebab persisnya
    // tanpa akses log server langsung). Ini pendekatan yang jauh lebih
    // pasti: data yang dipakai untuk render adalah data yang BARU SAJA
    // berhasil ditulis ke database, bukan hasil query ulang yang bisa
    // saja mengembalikan data basi.
    const dataMasuk = { id: presensiId, waktu_masuk: waktuMasukISO, terlambat_menit: terlambatMenit };

    if (terlambatMenit > 0) {
        return { warning: `Presensi masuk tercatat pukul ${jamStr} WIB. Anda terlambat ${terlambatMenit} menit.`, data: dataMasuk };
    }
    return { success: `Presensi masuk berhasil dicatat: ${jamStr} WIB.`, data: dataMasuk };
}

/**
 * Konversi tanggal (YYYY-MM-DD) + jam (HH:MM) yang dimaksudkan sebagai
 * WIB (UTC+7) jadi ISO string UTC yang benar untuk disimpan ke database.
 * Dipakai khusus untuk edit manual oleh admin — perhitungan murni
 * aritmatika (Date.UTC), TIDAK bergantung pada zona waktu server tempat
 * kode ini jalan, jadi hasilnya selalu benar di mana pun Vercel
 * menjalankan fungsi ini.
 */
function wibKeUtcIso(tanggal: string, jam: string): string {
    const [tahun, bulan, hari] = tanggal.split('-').map(Number);
    const [jamNum, menitNum] = jam.split(':').map(Number);
    const utcMillis = Date.UTC(tahun, bulan - 1, hari, jamNum - 7, menitNum, 0);
    return new Date(utcMillis).toISOString();
}

/**
 * Khusus admin: edit atau isi manual waktu presensi petugas (misal
 * petugas lupa presensi, atau ada kesalahan input). Menghitung ulang
 * terlambat_menit, pulang_awal_menit, kekurangan_menit berdasarkan jam
 * shift yang berlaku — konsisten dengan logika presensiMasuk/presensiKeluar,
 * TIDAK ada jalur berbeda yang bisa menghasilkan angka tidak sinkron.
 *
 * Petugas TIDAK PERNAH bisa memanggil ini — hanya field ini yang boleh
 * mengoreksi waktu presensi setelah tercatat, sesuai aturan yang diminta.
 */
export async function editPresensiAdmin(params: {
    jadwalPiketId: number;
    presensiId: number | null; // null kalau petugas belum presensi sama sekali (admin isi manual dari nol)
    tanggal: string; // YYYY-MM-DD, dari jadwal_piket.tanggal
    waktuMasuk: string; // "HH:MM"
    waktuKeluar: string; // "HH:MM" atau string kosong kalau belum/tidak keluar
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa mengedit waktu presensi.' };

    if (!params.waktuMasuk) return { error: 'Jam masuk wajib diisi.' };

    const { data: jadwalRaw } = await supabase
        .from('jadwal_piket')
        .select('user_id, shift_piket(*)')
        .eq('id', params.jadwalPiketId)
        .single();
    const jadwal = jadwalRaw as unknown as { user_id: string; shift_piket: { jam_mulai: string; jam_selesai: string } } | null;
    if (!jadwal) return { error: 'Jadwal tidak ditemukan.' };

    const waktuMasukISO = wibKeUtcIso(params.tanggal, params.waktuMasuk);
    const batasMulaiISO = wibKeUtcIso(params.tanggal, jadwal.shift_piket.jam_mulai.slice(0, 5));
    const terlambatMenit = Math.max(0, Math.round((new Date(waktuMasukISO).getTime() - new Date(batasMulaiISO).getTime()) / 60000));

    let waktuKeluarISO: string | null = null;
    let pulangAwalMenit = 0;
    let kekuranganMenit = terlambatMenit;

    if (params.waktuKeluar) {
        waktuKeluarISO = wibKeUtcIso(params.tanggal, params.waktuKeluar);
        const batasSelesaiISO = wibKeUtcIso(params.tanggal, jadwal.shift_piket.jam_selesai.slice(0, 5));
        pulangAwalMenit = Math.max(0, Math.round((new Date(batasSelesaiISO).getTime() - new Date(waktuKeluarISO).getTime()) / 60000));
        kekuranganMenit = terlambatMenit + pulangAwalMenit;
    }

    const payload = {
        user_id: jadwal.user_id,
        jadwal_piket_id: params.jadwalPiketId,
        waktu_masuk: waktuMasukISO,
        waktu_keluar: waktuKeluarISO,
        terlambat_menit: terlambatMenit,
        pulang_awal_menit: pulangAwalMenit,
        kekurangan_menit: kekuranganMenit,
    };

    const { error } = params.presensiId
        ? await supabase.from('presensi').update(payload).eq('id', params.presensiId)
        : await supabase.from('presensi').insert(payload);

    if (error) return { error: error.message };

    await supabase.from('jadwal_piket').update({ status: 'hadir' }).eq('id', params.jadwalPiketId);

    revalidatePath('/admin/jadwal');
    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');
    revalidatePath('/admin/petugas-terbaik');
    return { success: true };
}
export async function batalkanPresensi(presensiId: number, jadwalPiketId: number) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Sesi tidak valid, silakan login ulang.' };

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') return { error: 'Hanya admin yang bisa membatalkan presensi.' };

    const { error: deleteError } = await supabase.from('presensi').delete().eq('id', presensiId);
    if (deleteError) return { error: deleteError.message };

    // Kembalikan status jadwal ke 'terjadwal' (bukan 'hadir' lagi, karena
    // presensinya sudah dihapus)
    await supabase.from('jadwal_piket').update({ status: 'terjadwal' }).eq('id', jadwalPiketId);

    revalidatePath('/admin/jadwal');
    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');
    revalidatePath('/admin/petugas-terbaik');
    return { success: true };
}

/**
 * Presensi keluar. Pulang lebih awal dihitung independen dari keterlambatan
 * (TIDAK saling menutupi/mengompensasi) — kerja lembur tidak menghapus
 * catatan terlambat, dan datang lebih awal tidak "menabung" jatah pulang
 * cepat. kekurangan_menit = terlambat_menit + pulang_awal_menit.
 */
export async function presensiKeluar(presensiId: number): Promise<PresensiActionResult> {
    const supabase = await createClient();

    const { data: presensiRaw } = await supabase
        .from('presensi')
        .select('*, jadwal_piket(*, shift_piket(*))')
        .eq('id', presensiId)
        .single();

    // [FIX] Cast eksplisit — relasi to-one ditebak sebagai array tanpa generated types.
    const presensi = presensiRaw as unknown as {
        terlambat_menit: number;
        jadwal_piket: { shift_piket: { jam_selesai: string } };
    } | null;

    if (!presensi) return { error: 'Data presensi tidak ditemukan.' };

    const waktuKeluar = nowWIB();
    const waktuKeluarISO = new Date().toISOString();

    // ── Hitung pulang lebih awal (di-clamp ke 0, tidak bisa negatif) ──
    const batasSelesai = jamPada(waktuKeluar, presensi.jadwal_piket.shift_piket.jam_selesai);
    const pulangAwalMenit = menitSebelum(batasSelesai, waktuKeluar);

    // ── Total kekurangan = terlambat + pulang awal (independen, TIDAK saling menutupi) ──
    const terlambatMenit = presensi.terlambat_menit ?? 0;
    const kekuranganMenit = terlambatMenit + pulangAwalMenit;

    const { error: updateError } = await supabase.from('presensi').update({
        waktu_keluar: waktuKeluarISO,
        pulang_awal_menit: pulangAwalMenit,
        kekurangan_menit: kekuranganMenit,
    }).eq('id', presensiId);

    // [FIX] Cek error — lihat catatan di presensiMasuk di atas.
    if (updateError) return { error: `Gagal menyimpan presensi keluar: ${updateError.message}` };

    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');

    const jamStr = formatInTimeZone(waktuKeluarISO, TZ, 'HH:mm');

    // [FIX BUG PRESENSI] Sama seperti presensiMasuk — sertakan data mentah
    // supaya client update tampilan langsung dari respons ini.
    const dataKeluar = { id: presensiId, waktu_keluar: waktuKeluarISO, pulang_awal_menit: pulangAwalMenit, kekurangan_menit: kekuranganMenit };

    if (kekuranganMenit > 0) {
        const jam = Math.floor(kekuranganMenit / 60);
        const menit = kekuranganMenit % 60;
        const formatKurang = [jam > 0 ? `${jam} jam` : '', menit > 0 ? `${menit} menit` : ''].filter(Boolean).join(' ');

        const rincian: string[] = [];
        if (terlambatMenit > 0) rincian.push(`terlambat ${terlambatMenit} menit`);
        if (pulangAwalMenit > 0) rincian.push(`pulang ${pulangAwalMenit} menit lebih awal`);

        return {
            warning: `Presensi keluar tercatat pukul ${jamStr} WIB. Kekurangan jam: ${formatKurang} (${rincian.join(', ')}).`,
            data: dataKeluar,
        };
    }
    return { success: `Presensi keluar berhasil dicatat: ${jamStr} WIB. Jam kerja lengkap, tidak ada kekurangan.`, data: dataKeluar };
}
