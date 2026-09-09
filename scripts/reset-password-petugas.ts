/**
 * Script untuk RESET PASSWORD seluruh akun bertipe PETUGAS (bukan admin)
 * jadi satu password seragam: pst1571.
 *
 * [PENTING] Password akun Supabase Auth TIDAK BISA diubah lewat SQL biasa
 * (migration) — Supabase menyimpan hash password di skema internal
 * `auth.users` yang cuma bisa diubah lewat Admin API (butuh service role
 * key), bukan lewat query SQL langsung. Makanya ini script terpisah,
 * bukan file migration di folder supabase/migrations/.
 *
 * Cara jalankan:
 *   npx tsx scripts/reset-password-petugas.ts
 *
 * Membutuhkan SUPABASE_SERVICE_ROLE_KEY di .env.local (JANGAN pernah
 * expose key ini ke client/browser — hanya dipakai di script/server).
 *
 * Scope: HANYA akun dengan role='petugas' di tabel profiles — akun admin
 * TIDAK ikut ter-reset oleh script ini (kalau butuh reset admin juga,
 * ubah baris query di bawah dari .eq('role', 'petugas') jadi
 * .in('role', ['petugas', 'admin']), atau minta dibuatkan script terpisah).
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// ── Validasi awal — sama seperti scripts/seed-users.ts ──────────────
if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di .env.local');
    console.error('   Pastikan file .env.local ada di root folder proyek (bukan di dalam scripts/).');
    process.exit(1);
}

if (!supabaseUrl.startsWith('https://') || !supabaseUrl.includes('.supabase.co')) {
    console.error(`❌ NEXT_PUBLIC_SUPABASE_URL sepertinya tidak valid: "${supabaseUrl}"`);
    console.error('   Harusnya berformat: https://xxxxxxxxxxxx.supabase.co');
    process.exit(1);
}

if (!serviceRoleKey.startsWith('eyJ')) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY sepertinya tidak valid (bukan format JWT, harus diawali "eyJ").');
    console.error('   Cek lagi: Supabase Dashboard → Project Settings → API → baris "service_role" (bukan "anon").');
    process.exit(1);
}

try {
    const payload = JSON.parse(Buffer.from(serviceRoleKey.split('.')[1], 'base64').toString());
    if (payload.role !== 'service_role') {
        console.error(`❌ Key yang dipakai punya role "${payload.role}", seharusnya "service_role".`);
        console.error('   Anda kemungkinan salah salin ANON key. Ambil ulang dari baris "service_role" di dashboard.');
        process.exit(1);
    }
} catch {
    console.error('❌ Gagal membaca isi SUPABASE_SERVICE_ROLE_KEY — pastikan tidak ada karakter terpotong saat copy-paste.');
    process.exit(1);
}

console.log(`✅ Konfigurasi valid. Menghubungkan ke: ${supabaseUrl}\n`);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD_BARU = 'pst1571';

async function main() {
    console.log(`🚀 Reset password seluruh akun petugas jadi "${PASSWORD_BARU}"...\n`);

    const { data: petugasList, error: errorAmbil } = await supabase
        .from('profiles')
        .select('id, email, name')
        .eq('role', 'petugas')
        .order('name');

    if (errorAmbil) {
        console.error('❌ Gagal ambil daftar petugas:', errorAmbil.message);
        process.exit(1);
    }

    if (!petugasList || petugasList.length === 0) {
        console.log('⚠️  Tidak ada akun dengan role="petugas" ditemukan. Tidak ada yang direset.');
        return;
    }

    console.log(`Ditemukan ${petugasList.length} akun petugas.\n`);

    let berhasil = 0;
    let gagal = 0;

    for (const p of petugasList) {
        const { error } = await supabase.auth.admin.updateUserById(p.id, { password: PASSWORD_BARU });

        if (error) {
            console.log(`⚠️  ${p.email} (${p.name}): ${error.message}`);
            gagal++;
            continue;
        }
        console.log(`✅ ${p.email.padEnd(38)} ${p.name}`);
        berhasil++;
    }

    console.log(`\n🎉 Selesai! ${berhasil} berhasil direset, ${gagal} gagal.`);
    console.log(`   Password baru seluruh akun petugas: "${PASSWORD_BARU}"`);
    console.log('   Sarankan setiap petugas ganti password sendiri setelah login pertama kali.');
}

main();
