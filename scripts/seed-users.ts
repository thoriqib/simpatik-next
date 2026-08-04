/**
 * Script untuk membuat akun Admin & Petugas awal via Supabase Admin API.
 * Dijalankan SEKALI setelah project Supabase & schema.sql siap.
 *
 * Cara jalankan:
 *   npx tsx scripts/seed-users.ts
 *
 * Membutuhkan SUPABASE_SERVICE_ROLE_KEY di .env.local (JANGAN pernah
 * expose key ini ke client/browser — hanya dipakai di script/server).
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

// ── Validasi awal yang lebih jelas dari sekadar "Invalid API key" ──
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

// Peringatan dini jika tertukar dengan anon key (keduanya diawali "eyJ" jadi perlu dicek lebih spesifik)
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

const users = [
    { email: 'admin@bps-jambi.go.id', password: 'Admin@BPS2024', name: 'Administrator Simpatik', role: 'admin' },
    { email: 'budi.santoso@bps-jambi.go.id', password: 'password123', name: 'Budi Santoso', role: 'petugas' },
    { email: 'siti.rahayu@bps-jambi.go.id', password: 'password123', name: 'Siti Rahayu', role: 'petugas' },
    { email: 'ahmad.kurniawan@bps-jambi.go.id', password: 'password123', name: 'Ahmad Kurniawan', role: 'petugas' },
    { email: 'dewi.anggraini@bps-jambi.go.id', password: 'password123', name: 'Dewi Anggraini', role: 'petugas' },
    { email: 'eko.prasetyo@bps-jambi.go.id', password: 'password123', name: 'Eko Prasetyo', role: 'petugas' },
    { email: 'fitri.handayani@bps-jambi.go.id', password: 'password123', name: 'Fitri Handayani', role: 'petugas' },
];

async function main() {
    console.log('🚀 Membuat akun awal Simpatik...\n');

    for (const u of users) {
        const { data, error } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { name: u.name, role: u.role },
        });

        if (error) {
            console.log(`⚠️  ${u.email}: ${error.message} (status: ${error.status ?? '-'})`);
            continue;
        }
        console.log(`✅ ${u.role.padEnd(8)} ${u.email}`);
    }

    console.log('\n🎉 Selesai! Password semua akun: lihat tabel di atas.');
    console.log('   Trigger "on_auth_user_created" otomatis mengisi tabel profiles.');
}

main();
