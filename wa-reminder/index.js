/**
 * Pengingat piket harian Simpatik via WhatsApp — GRATIS.
 *
 * Cara kerja: layanan kecil ini jalan terus di VPS, login ke WhatsApp
 * lewat scan QR (seperti WhatsApp Web), lalu setiap hari pukul 07.00 WIB
 * membaca jadwal piket hari itu dari Supabase dan mengirim SATU pesan
 * pengingat ke tiap petugas yang punya nomor WhatsApp.
 *
 *   node index.js              → layanan penuh (login WA + kirim otomatis tiap hari)
 *   node index.js --dry        → hanya tampilkan siapa dapat pesan apa hari ini (tidak mengirim, tidak perlu login WA)
 *   node index.js --sekarang   → login WA, kirim pengingat hari ini SEKARANG lalu keluar
 *
 * CATATAN RISIKO: ini memakai WhatsApp Web tidak resmi (Baileys). Gunakan
 * nomor KHUSUS (bukan nomor pribadi). Volume kecil (±belasan pesan/hari
 * dengan jeda acak) membuat risiko blokir rendah, tapi tidak nol.
 */
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cron from 'node-cron';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { createClient } from '@supabase/supabase-js';
import * as baileys from '@whiskeysockets/baileys';
import { tanggalWib, hariDalamPekan, susunPesan, keJid, acakDetik, namaTanpaGelar, tanggalPanjang } from './lib.js';

// Baileys 6 adalah paket CommonJS — bentuk ekspor default-nya berbeda tergantung loader.
const makeWASocket = baileys.default?.default ?? baileys.default ?? baileys.makeWASocket;
const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys.default?.useMultiFileAuthState ? baileys.default : baileys;

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DIR_AUTH = path.join(DIR, 'auth');          // sesi WhatsApp (JANGAN dibagikan/di-commit)
const DIR_TERKIRIM = path.join(DIR, 'terkirim');  // penanda "hari ini sudah dikirim" (cegah dobel)

const ARGS = new Set(process.argv.slice(2));
const MODE_DRY = ARGS.has('--dry');
const MODE_SEKARANG = ARGS.has('--sekarang');

const CRON_JADWAL = process.env.CRON_JADWAL || '0 7 * * *';
const JEDA_MIN = Number(process.env.JEDA_MIN_DETIK ?? 6);
const JEDA_MAX = Number(process.env.JEDA_MAX_DETIK ?? 14);

const log = pino({ level: 'info' });
const tidur = (ms) => new Promise((r) => setTimeout(r, ms));

function bikinSupabase() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi di file .env');
    return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/**
 * Ambil siapa saja yang harus dikirimi pengingat untuk `tanggal`.
 * Mengembalikan { alasanLewat } kalau hari ini memang tidak ada pelayanan.
 */
export async function ambilPenerima(supabase, tanggal) {
    const hari = hariDalamPekan(tanggal);
    if (hari === 0 || hari === 6) return { alasanLewat: 'akhir pekan', penerima: [] };

    const { data: libur, error: errLibur } = await supabase.from('hari_libur').select('keterangan').eq('tanggal', tanggal).maybeSingle();
    if (errLibur) throw new Error(`Gagal membaca hari libur: ${errLibur.message}`);
    if (libur) return { alasanLewat: `hari libur (${libur.keterangan})`, penerima: [] };

    const { data, error } = await supabase
        .from('jadwal_piket')
        .select('user_id, status, profiles(name, no_hp), shift_piket(nama_shift, jam_mulai, jam_selesai)')
        .eq('tanggal', tanggal)
        .in('status', ['terjadwal', 'hadir']); // izin/sakit/alpha tidak perlu pengingat
    if (error) throw new Error(`Gagal membaca jadwal: ${error.message}`);

    // Kelompokkan per petugas (satu pesan per orang walau ada >1 shift)
    const peta = new Map();
    for (const j of data ?? []) {
        const p = Array.isArray(j.profiles) ? j.profiles[0] : j.profiles;
        const s = Array.isArray(j.shift_piket) ? j.shift_piket[0] : j.shift_piket;
        if (!p || !s) continue;
        if (!peta.has(j.user_id)) peta.set(j.user_id, { userId: j.user_id, nama: p.name, noHp: p.no_hp, shifts: [] });
        peta.get(j.user_id).shifts.push(s);
    }
    const semua = [...peta.values()].map((x) => ({ ...x, shifts: x.shifts.sort((a, b) => String(a.jam_mulai).localeCompare(String(b.jam_mulai))) }));
    return { alasanLewat: null, penerima: semua };
}

function sudahDikirimHariIni(tanggal) { return fs.existsSync(path.join(DIR_TERKIRIM, `${tanggal}.json`)); }
function tandaiTerkirim(tanggal, ringkasan) {
    fs.mkdirSync(DIR_TERKIRIM, { recursive: true });
    fs.writeFileSync(path.join(DIR_TERKIRIM, `${tanggal}.json`), JSON.stringify(ringkasan, null, 2));
}

/** Kirim semua pengingat hari ini. `sock` boleh null untuk mode dry. */
export async function kirimPengingatHariIni(supabase, sock, { dry = false, paksa = false } = {}) {
    const tanggal = tanggalWib();
    log.info(`Memproses pengingat untuk ${tanggalPanjang(tanggal)}`);

    if (!dry && !paksa && sudahDikirimHariIni(tanggal)) {
        log.warn('Pengingat hari ini sudah pernah dikirim — dilewati (hapus file di folder terkirim/ kalau ingin kirim ulang).');
        return;
    }

    const { alasanLewat, penerima } = await ambilPenerima(supabase, tanggal);
    if (alasanLewat) { log.info(`Tidak ada pengiriman: ${alasanLewat}.`); return; }
    if (penerima.length === 0) { log.info('Tidak ada petugas terjadwal hari ini.'); return; }

    const ringkasan = { tanggal, terkirim: [], tanpaNomor: [], nomorTidakValid: [], tidakTerdaftarWa: [], gagal: [] };

    for (const [i, p] of penerima.entries()) {
        const nama = namaTanpaGelar(p.nama);
        if (!p.noHp) { ringkasan.tanpaNomor.push(nama); log.info(`- ${nama}: belum punya nomor WhatsApp, dilewati`); continue; }
        const jid = keJid(p.noHp);
        if (!jid) { ringkasan.nomorTidakValid.push(nama); log.warn(`- ${nama}: nomor tidak valid (${p.noHp}), dilewati`); continue; }

        const teks = susunPesan({ nama: p.nama, tanggal, shifts: p.shifts });
        if (dry) { console.log(`\n=== ${nama} → ${p.noHp} ===\n${teks}\n`); continue; }

        try {
            const [cek] = (await sock.onWhatsApp(jid)) ?? [];
            if (!cek?.exists) { ringkasan.tidakTerdaftarWa.push(nama); log.warn(`- ${nama}: nomor tidak terdaftar di WhatsApp`); continue; }
            await sock.sendMessage(cek.jid ?? jid, { text: teks });
            ringkasan.terkirim.push(nama);
            log.info(`- ${nama}: terkirim`);
        } catch (err) {
            ringkasan.gagal.push(nama);
            log.error(`- ${nama}: GAGAL — ${err?.message ?? err}`);
        }

        if (i < penerima.length - 1) await tidur(acakDetik(JEDA_MIN, JEDA_MAX)); // jeda acak antar pesan
    }

    if (dry) { log.info(`[DRY] Selesai. ${penerima.length} petugas terjadwal; tidak ada pesan yang dikirim.`); return; }

    tandaiTerkirim(tanggal, ringkasan);
    log.info(`Selesai: ${ringkasan.terkirim.length} terkirim, ${ringkasan.gagal.length} gagal, ${ringkasan.tanpaNomor.length} tanpa nomor.`);

    // Ringkasan opsional ke admin
    const adminJid = keJid(process.env.NOMOR_ADMIN_RINGKASAN);
    if (adminJid) {
        const baris = [
            `Ringkasan pengingat piket ${tanggalPanjang(tanggal)}:`,
            `✅ Terkirim: ${ringkasan.terkirim.length}`,
            ringkasan.tanpaNomor.length ? `⚠️ Belum ada nomor: ${ringkasan.tanpaNomor.join(', ')}` : null,
            ringkasan.nomorTidakValid.length ? `⚠️ Nomor tidak valid: ${ringkasan.nomorTidakValid.join(', ')}` : null,
            ringkasan.tidakTerdaftarWa.length ? `⚠️ Tidak terdaftar WA: ${ringkasan.tidakTerdaftarWa.join(', ')}` : null,
            ringkasan.gagal.length ? `❌ Gagal: ${ringkasan.gagal.join(', ')}` : null,
        ].filter(Boolean).join('\n');
        try { await sock.sendMessage(adminJid, { text: baris }); } catch (err) { log.error(`Gagal kirim ringkasan ke admin: ${err?.message ?? err}`); }
    }
}

/** Buka koneksi WhatsApp; resolve begitu 'open'. Auto-reconnect kalau putus (kecuali logout). */
async function sambungWhatsApp(onOpen) {
    const { state, saveCreds } = await useMultiFileAuthState(DIR_AUTH);
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'warn' }),
        browser: ['Simpatik Reminder', 'Chrome', '1.0.0'],
        markOnlineOnConnect: false,
        syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
        if (qr) {
            console.log('\nScan QR ini dari WhatsApp nomor KHUSUS: Perangkat Tertaut → Tautkan Perangkat\n');
            qrcode.generate(qr, { small: true });
        }
        if (connection === 'open') { log.info('WhatsApp terhubung.'); onOpen(sock); }
        if (connection === 'close') {
            const kode = lastDisconnect?.error?.output?.statusCode;
            if (kode === DisconnectReason.loggedOut) {
                log.error('Sesi WhatsApp keluar (logout). Hapus folder auth/ lalu jalankan ulang untuk scan QR baru.');
                process.exit(1);
            }
            log.warn(`Koneksi terputus (kode ${kode}) — menyambung ulang…`);
            setTimeout(() => sambungWhatsApp(onOpen).catch((e) => log.error(e)), 5000);
        }
    });
    return sock;
}

async function main() {
    if (MODE_DRY) {
        await kirimPengingatHariIni(bikinSupabase(), null, { dry: true });
        return;
    }

    const supabase = bikinSupabase();

    if (MODE_SEKARANG) {
        let selesai = false;
        await sambungWhatsApp(async (sock) => {
            if (selesai) return;
            selesai = true;
            try { await kirimPengingatHariIni(supabase, sock, { paksa: true }); }
            finally { await tidur(3000); process.exit(0); }
        });
        return;
    }

    // Mode layanan: tetap tersambung, kirim otomatis sesuai jadwal cron (zona WIB)
    let sockAktif = null;
    await sambungWhatsApp((sock) => { sockAktif = sock; });

    cron.schedule(CRON_JADWAL, async () => {
        if (!sockAktif) { log.error('Jadwal kirim tiba tapi WhatsApp belum terhubung — dilewati hari ini.'); return; }
        try { await kirimPengingatHariIni(supabase, sockAktif); }
        catch (err) { log.error(`Gagal memproses pengingat: ${err?.message ?? err}`); }
    }, { timezone: 'Asia/Jakarta' });

    log.info(`Layanan aktif. Pengingat dikirim otomatis dengan jadwal cron "${CRON_JADWAL}" (WIB).`);
}

// Jalankan hanya kalau dipanggil langsung (bukan saat diimpor untuk tes)
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    main().catch((err) => { log.error(err); process.exit(1); });
}
