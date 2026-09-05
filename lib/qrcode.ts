import QRCode from 'qrcode';

/**
 * Generate QR code sebagai data URI (base64 PNG) di server — bukan
 * lewat layanan pihak ketiga (mis. api.qrserver.com), supaya tidak
 * bergantung ketersediaan/kebijakan layanan eksternal untuk elemen UI
 * yang cukup penting (tiket antrian, materi cetak Pesta Koja).
 */
export async function buatQrCodeDataUri(teks: string): Promise<string> {
    return QRCode.toDataURL(teks, {
        width: 240,
        margin: 1,
        color: { dark: '#0B1A2E', light: '#FFFFFF' },
    });
}
