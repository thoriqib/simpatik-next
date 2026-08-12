import { Resend } from 'resend';

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
                    </div>
                </div>
            `,
        });

        if (error) {
            console.error('[email] Gagal kirim via Resend:', error);
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
