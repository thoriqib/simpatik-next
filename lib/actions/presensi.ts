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

/**
 * Presensi masuk. Keterlambatan dihitung & DISIMPAN LANGSUNG saat ini
 * (bukan cuma ditampilkan sekali di pesan toast) — supaya tetap akurat
 * dan konsisten dipakai ulang oleh laporan kapan pun, bukan cuma saat
 * momen presensi terjadi.
 */
export async function presensiMasuk(jadwalPiketId: number) {
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

    if (existing) {
        await supabase.from('presensi').update({ waktu_masuk: waktuMasukISO, terlambat_menit: terlambatMenit }).eq('id', existing.id);
    } else {
        await supabase.from('presensi').insert({
            user_id: user.id,
            jadwal_piket_id: jadwalPiketId,
            waktu_masuk: waktuMasukISO,
            terlambat_menit: terlambatMenit,
        });
    }

    await supabase.from('jadwal_piket').update({ status: 'hadir' }).eq('id', jadwalPiketId);

    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');

    const jamStr = formatInTimeZone(waktuMasukISO, TZ, 'HH:mm');
    if (terlambatMenit > 0) {
        return { warning: `Presensi masuk tercatat pukul ${jamStr} WIB. Anda terlambat ${terlambatMenit} menit.` };
    }
    return { success: `Presensi masuk berhasil dicatat: ${jamStr} WIB.` };
}

/**
 * Presensi keluar. Pulang lebih awal dihitung independen dari keterlambatan
 * (TIDAK saling menutupi/mengompensasi) — kerja lembur tidak menghapus
 * catatan terlambat, dan datang lebih awal tidak "menabung" jatah pulang
 * cepat. kekurangan_menit = terlambat_menit + pulang_awal_menit.
 */
export async function presensiKeluar(presensiId: number) {
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

    await supabase.from('presensi').update({
        waktu_keluar: waktuKeluarISO,
        pulang_awal_menit: pulangAwalMenit,
        kekurangan_menit: kekuranganMenit,
    }).eq('id', presensiId);

    revalidatePath('/petugas/dashboard');
    revalidatePath('/petugas/presensi');
    revalidatePath('/admin/laporan/presensi');

    const jamStr = formatInTimeZone(waktuKeluarISO, TZ, 'HH:mm');
    if (kekuranganMenit > 0) {
        const jam = Math.floor(kekuranganMenit / 60);
        const menit = kekuranganMenit % 60;
        const formatKurang = [jam > 0 ? `${jam} jam` : '', menit > 0 ? `${menit} menit` : ''].filter(Boolean).join(' ');

        const rincian: string[] = [];
        if (terlambatMenit > 0) rincian.push(`terlambat ${terlambatMenit} menit`);
        if (pulangAwalMenit > 0) rincian.push(`pulang ${pulangAwalMenit} menit lebih awal`);

        return {
            warning: `Presensi keluar tercatat pukul ${jamStr} WIB. Kekurangan jam: ${formatKurang} (${rincian.join(', ')}).`,
        };
    }
    return { success: `Presensi keluar berhasil dicatat: ${jamStr} WIB. Jam kerja lengkap, tidak ada kekurangan.` };
}
