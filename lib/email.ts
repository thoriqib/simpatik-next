import { Resend } from 'resend';

const SKD_URL = 'https://skd.bps.go.id/skd/s/1571';

/**
 * Integrasi email lewat Resend (https://resend.com) — gratis sampai
 * 3.000 email/bulan, cukup untuk kebutuhan notifikasi seperti ini.
 *
 * CARA AKTIFKAN:
 * 1. Daftar di resend.com, verifikasi domain pengirim (atau pakai
 *    domain uji "onboarding@resend.dev" dulu untuk testing)
 * 2. Buat API Key di dashboard Resend
 * 3. Isi environment variable di Vercel:
 *      RESEND_API_KEY=re_xxxxxxxxxxxx
 *      RESEND_FROM_EMAIL="Simpatik BPS Kota Jambi <noreply@domain-anda.id>"
 *
 * Selama RESEND_API_KEY belum diisi, pengiriman email otomatis
 * dilewati (tidak error) — link tetap tampil di layar sebagai jalur
 * utama, email cuma pelengkap.
 */

function getResendClient(): Resend | null {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) return null;
    return new Resend(apiKey);
}

export async function kirimEmailLinkPermintaanData(params: {
    to: string;
    namaLengkap: string;
    token: string;
}): Promise<{ sent: boolean; skipped?: boolean; error?: string }> {
    const resend = getResendClient();

    if (!resend) {
        console.warn('[email] RESEND_API_KEY belum diset — email tidak dikirim, link tetap tampil di layar.');
        return { sent: false, skipped: true };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const link = `${appUrl}/permintaan-data/lacak/${params.token}`;
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'Simpatik <onboarding@resend.dev>';

    try {
        const { error } = await resend.emails.send({
            from: fromEmail,
            to: params.to,
            subject: 'Link Lacak Permintaan Data — Simpatik BPS Kota Jambi',
            html: `
                <div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #0B1A2E;">
                    <div style="background: #0B1A2E; padding: 24px; border-radius: 16px 16px 0 0; text-align: center;">
                        <h1 style="color: white; font-size: 18px; margin: 0;">Simpatik</h1>
                        <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 4px 0 0;">Sistem Informasi Pelayanan Statistik — BPS Kota Jambi</p>
                    </div>
                    <div style="padding: 24px; border: 1px solid #E7E3DA; border-top: none; border-radius: 0 0 16px 16px;">
                        <p>Halo <strong>${escapeHtml(params.namaLengkap)}</strong>,</p>
                        <p>Terima kasih sudah mengirimkan permintaan/konsultasi data ke BPS Kota Jambi. Gunakan link di bawah untuk melihat status dan berkomunikasi langsung dengan petugas kami:</p>
                        <div style="text-align: center; margin: 24px 0;">
                            <a href="${link}" style="display: inline-block; background: #1B3A5F; color: white; padding: 12px 28px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 14px;">
                                Lihat Status Permintaan
                            </a>
                        </div>
                        <p style="font-size: 13px; color: #6B7280;">Atau salin link berikut ke browser Anda:</p>
                        <p style="font-size: 12px; color: #1B3A5F; word-break: break-all;">${link}</p>
                        <p style="font-size: 13px; color: #6B7280; margin-top: 24px;">Simpan link ini baik-baik — siapa pun yang memilikinya bisa melihat & membalas percakapan ini.</p>
                        <div style="margin-top: 28px; padding: 16px; background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 12px;">
                            <p style="font-size: 13px; color: #92620A; margin: 0 0 8px; font-weight: 600;">Bantu Kami Lebih Baik Lagi</p>
                            <p style="font-size: 13px; color: #92620A; margin: 0 0 12px;">Isi Survei Kebutuhan Data (SKD) — masukan Anda membantu BPS Kota Jambi merancang layanan statistik yang lebih sesuai kebutuhan masyarakat.</p>
                            <a href="${SKD_URL}" style="display: inline-block; background: #D97706; color: white; padding: 8px 20px; border-radius: 999px; text-decoration: none; font-weight: 600; font-size: 13px;">
                                Isi Survei SKD
                            </a>
                        </div>
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('[email] Gagal kirim via Resend:', error);

            // [DEBUG] Deteksi khusus: akun Resend belum verifikasi domain
            // (masih mode testing) — ini BUKAN bug kode, murni langkah
            // konfigurasi yang belum selesai di dashboard Resend. Beri
            // pesan yang jelas di log supaya admin langsung tahu harus
            // ke resend.com/domains, bukan mengira ada yang rusak.
            if (error.message?.toLowerCase().includes('own email address') || error.message?.toLowerCase().includes('verify a domain')) {
                console.error(
                    '[email] ⚠️  AKUN RESEND MASIH MODE TESTING — hanya bisa kirim ke email ' +
                    'pendaftar akun sendiri. Ini BUKAN bug kode. Perbaikan: (1) buka resend.com/domains, ' +
                    '(2) tambah & verifikasi domain milik Anda (perlu akses DNS), ' +
                    '(3) ubah RESEND_FROM_EMAIL di Vercel ke alamat pada domain yang sudah terverifikasi ' +
                    '(mis. noreply@domainanda.go.id), (4) redeploy.'
                );
            }

            return { sent: false, error: error.message };
        }
        return { sent: true };
    } catch (err) {
        console.error('[email] Exception saat kirim email:', err);
        return { sent: false, error: err instanceof Error ? err.message : 'Unknown error' };
    }
}

/** Escape dasar untuk mencegah HTML injection lewat nama pengunjung di template email. */
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
