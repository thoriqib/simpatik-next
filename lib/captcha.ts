import 'server-only';
import { headers } from 'next/headers';

/**
 * Verifikasi Cloudflare Turnstile di SERVER.
 * - TURNSTILE_SECRET_KEY belum diisi → captcha dianggap nonaktif (lolos), supaya
 *   form tidak mati sebelum key dipasang. Setelah key diisi, token WAJIB valid.
 * - Gagal menghubungi Cloudflare → ditolak (fail-closed) dengan pesan ramah.
 */
export async function verifikasiCaptcha(formData: FormData): Promise<{ ok: true } | { ok: false; error: string }> {
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (!secret) return { ok: true };

    const token = (formData.get('cf-turnstile-response') as string | null) ?? '';
    if (!token) return { ok: false, error: 'Mohon selesaikan verifikasi captcha terlebih dahulu.' };

    try {
        const h = await headers();
        const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim();
        const body = new URLSearchParams({ secret, response: token });
        if (ip) body.set('remoteip', ip);

        const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body,
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
        });
        const data = (await res.json()) as { success?: boolean };
        if (data.success) return { ok: true };
        return { ok: false, error: 'Verifikasi captcha gagal atau kedaluwarsa. Silakan coba lagi.' };
    } catch {
        return { ok: false, error: 'Verifikasi captcha tidak dapat diproses saat ini. Silakan coba lagi.' };
    }
}
