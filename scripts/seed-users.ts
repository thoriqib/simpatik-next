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

// Password default untuk seluruh petugas — WAJIB diganti setelah login pertama.
const DEFAULT_PASSWORD = 'Petugas@BPS2026';

const users = [
    { email: 'admin@bps-jambi.go.id', password: 'Admin@BPS2024', name: 'Administrator Simpatik', role: 'admin' },

    // ── Petugas Pelayanan — BPS Kota Jambi ──────────────────────
    { email: 'rizon@bps.go.id',                password: DEFAULT_PASSWORD, name: 'Afrizon, S.E, M.Si',                 role: 'petugas' },
    { email: 'danik@bps.go.id',                password: DEFAULT_PASSWORD, name: 'Danik Lurisdjati, SST, M.Si.',       role: 'petugas' },
    { email: 'wijay@bps.go.id',                password: DEFAULT_PASSWORD, name: 'Wijayanti Agustini, S.Pt, M.E.',     role: 'petugas' },
    { email: 'isna.rahayu@bps.go.id',          password: DEFAULT_PASSWORD, name: 'Isna Rahayu, SST',                  role: 'petugas' },
    { email: 'diah.sari@bps.go.id',            password: DEFAULT_PASSWORD, name: 'Diah Pravita Sari, SST',            role: 'petugas' },
    { email: 'kirman@bps.go.id',               password: DEFAULT_PASSWORD, name: 'Sukirman, SE.',                    role: 'petugas' },
    { email: 'ardanayu@bps.go.id',             password: DEFAULT_PASSWORD, name: 'Ardana Yulmiroza Utari, S.ST',      role: 'petugas' },
    { email: 'faradina.handayani@bps.go.id',   password: DEFAULT_PASSWORD, name: 'Faradina Handayani, SST',           role: 'petugas' },
    { email: 'wulanagusp@bps.go.id',           password: DEFAULT_PASSWORD, name: 'Wulan Agus Pramita Sari, SST',      role: 'petugas' },
    { email: 'ari.hidayat@bps.go.id',          password: DEFAULT_PASSWORD, name: 'Ari Hidayat, SST',                  role: 'petugas' },
    { email: 'joulanda@bps.go.id',             password: DEFAULT_PASSWORD, name: 'Joulanda Ansye Roring, S.E.',       role: 'petugas' },
    { email: 'salman.assad@bps.go.id',         password: DEFAULT_PASSWORD, name: 'Salman Assad Ibrahim, SST',         role: 'petugas' },
    { email: 'mahardika.usman@bps.go.id',      password: DEFAULT_PASSWORD, name: 'Mahardika Usman, SST',              role: 'petugas' },
    { email: 'dhira.fajri@bps.go.id',          password: DEFAULT_PASSWORD, name: 'Dhira Fajri Atika, S.Tr.Stat',      role: 'petugas' },
    { email: 'kiky.amci@bps.go.id',            password: DEFAULT_PASSWORD, name: 'Kiky Amci Ilzania, S.Tr.Stat.',     role: 'petugas' },
    { email: 'noza.milla@bps.go.id',           password: DEFAULT_PASSWORD, name: 'Noza Millatul Kafa, S.Tr.Stat.',    role: 'petugas' },
    { email: 'ananda.fauziah@bps.go.id',       password: DEFAULT_PASSWORD, name: 'Rizki Ananda Fauziah, S.Tr.Stat.',  role: 'petugas' },
    { email: 'asrifah@bps.go.id',              password: DEFAULT_PASSWORD, name: "Asrif'Ah, S.Tr.Stat.",              role: 'petugas' },
    { email: 'resty.wahyuni@bps.go.id',        password: DEFAULT_PASSWORD, name: 'Resty Wahyuni Siregar, S.Tr.Stat.', role: 'petugas' },
    { email: 'kiky.frisca@bps.go.id',          password: DEFAULT_PASSWORD, name: 'Kiky Frisca, S.Si.',                role: 'petugas' },
    { email: 'thoriq.ibadurrohman@bps.go.id',  password: DEFAULT_PASSWORD, name: 'Thoriq Ibadurrohman, S.Tr.Stat.',   role: 'petugas' },
    { email: 'desijawase-pppk@bps.go.id',      password: DEFAULT_PASSWORD, name: 'Desi Dwi Jawase, SE',               role: 'petugas' },
    { email: 'elysia.putri@bps.go.id',         password: DEFAULT_PASSWORD, name: 'Elysia Putri Linda Triana, S.Tr.Stat.', role: 'petugas' },
    { email: 'sasria@bps.go.id',               password: DEFAULT_PASSWORD, name: 'Hery Sasria, S.Si., M.SE.',         role: 'petugas' },
    { email: 'sumarman@bps.go.id',             password: DEFAULT_PASSWORD, name: 'Sumarman',                         role: 'petugas' },
    { email: 'kelik.heri@bps.go.id',           password: DEFAULT_PASSWORD, name: 'Kelik Heri Purnomo, S.Si, M.M.',    role: 'petugas' },
    { email: 'raudhatul.hasanah@bps.go.id',    password: DEFAULT_PASSWORD, name: 'Raudhatul Hasanah, A.Md.Kb.N.',     role: 'petugas' },
    { email: 'budihartono-pppk@bps.go.id',     password: DEFAULT_PASSWORD, name: 'Budi Hartono',                     role: 'petugas' },
    { email: 'lisaanggraeni-pppk@bps.go.id',   password: DEFAULT_PASSWORD, name: 'Lisa Anggraeni',                   role: 'petugas' },
    { email: 'tusih-pppk@bps.go.id',           password: DEFAULT_PASSWORD, name: 'Tusih',                            role: 'petugas' },
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
