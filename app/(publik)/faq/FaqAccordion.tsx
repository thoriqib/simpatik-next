'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

type FaqItem = { q: string; a: string };
type FaqKategori = { kategori: string; items: FaqItem[] };

const FAQ_DATA: FaqKategori[] = [
    {
        kategori: 'Kunjungan & Antrian',
        items: [
            {
                q: 'Bagaimana cara mengambil nomor antrian?',
                a: 'Nomor antrian diambil langsung di layar/tablet yang tersedia di ruang pelayanan kantor BPS Kota Jambi — bukan dari rumah. Ini untuk memastikan nomor antrian hanya diambil oleh pengunjung yang memang sudah berada di lokasi.',
            },
            {
                q: 'Kapan jam pelayanan BPS Kota Jambi?',
                a: 'Jam pelayanan mengikuti jadwal shift petugas yang berlaku, ditampilkan otomatis secara real-time di halaman ambil antrian. Pengambilan nomor antrian ditutup total pada pukul 18.00–07.00 WIB.',
            },
            {
                q: 'Saya sudah dilayani, bagaimana cara memberi penilaian?',
                a: 'Tautan penilaian muncul otomatis di halaman tiket antrian Anda setelah pelayanan selesai. Beri bintang 1–5 beserta komentar untuk membantu kami meningkatkan kualitas layanan.',
            },
        ],
    },
    {
        kategori: 'Permintaan Data & Konsultasi Online',
        items: [
            {
                q: 'Apakah saya harus datang langsung untuk konsultasi/minta data?',
                a: 'Tidak selalu. Ajukan permintaan atau konsultasi data lewat form daring di menu Permintaan Data — bisa dari mana saja, kapan saja (form dibuka pada jam pelayanan). Anda akan mendapat link unik untuk berkomunikasi langsung dengan petugas.',
            },
            {
                q: 'Saya kehilangan link lacak permintaan data saya, bagaimana?',
                a: 'Buka menu Permintaan Data → "Sudah pernah mengajukan sebelumnya?" → masukkan email yang Anda gunakan saat mengajukan. Semua permintaan dengan email tersebut akan ditampilkan, lengkap dengan link menuju masing-masing.',
            },
            {
                q: 'Kenapa saya tidak bisa kirim pesan di jam tertentu?',
                a: 'Percakapan (chat) dengan petugas hanya aktif pada jam pelayanan. Di luar jam tersebut, riwayat percakapan tetap bisa dibaca, tapi pesan baru baru bisa dikirim lagi saat jam pelayanan berlangsung.',
            },
            {
                q: 'Apakah permintaan data saya bisa dilihat orang lain?',
                a: 'Tidak. Setiap permintaan punya link unik acak yang mustahil ditebak — hanya yang memegang link (atau tahu email yang didaftarkan) yang bisa mengakses percakapannya.',
            },
        ],
    },
    {
        kategori: 'Pengaduan',
        items: [
            {
                q: 'Apakah pengaduan saya akan diketahui identitasnya?',
                a: 'Tidak. Pengaduan bersifat sepenuhnya anonim — kami sengaja tidak meminta nama, email, atau kontak apa pun. Setelah kirim, Anda mendapat link dan kode token unik untuk memantau tindak lanjutnya.',
            },
            {
                q: 'Saya kehilangan link/token pengaduan saya, bagaimana?',
                a: 'Berbeda dengan permintaan data, pengaduan tidak menyimpan email — jadi satu-satunya cara memulihkan akses adalah lewat link atau kode token itu sendiri. Buka menu Pengaduan → "Sudah melakukan pengaduan sebelumnya?" dan tempelkan link/token yang Anda simpan. Kalau benar-benar hilang keduanya, mohon maaf percakapan itu tidak bisa dipulihkan — ini konsekuensi dari menjaga anonimitas sepenuhnya.',
            },
            {
                q: 'Berapa lama pengaduan saya ditindaklanjuti?',
                a: 'Waktu tindak lanjut bervariasi tergantung kompleksitas. Anda bisa memantau statusnya (Baru/Diproses/Selesai) kapan saja lewat link/token yang diberikan.',
            },
        ],
    },
    {
        kategori: 'Pesta Koja & Layanan Lain',
        items: [
            {
                q: 'Apa itu Pesta Koja?',
                a: 'Pesta Koja (Pelayanan Statistik Kota Jambi) adalah pusat akses cepat ke seluruh layanan digital BPS Kota Jambi dalam satu tempat — mulai dari konsultasi via WhatsApp (PANDAWA), perpustakaan digital, rekomendasi statistik, pembelian data mikro, survei kebutuhan data, hingga akses informasi publik (PPID).',
            },
            {
                q: 'Bisakah saya melihat jadwal petugas yang bertugas?',
                a: 'Untuk saat ini, jadwal lengkap petugas hanya bisa diakses oleh petugas dan admin yang sudah login, sebagai bagian dari pengelolaan internal.',
            },
        ],
    },
];

function AccordionItem({ item }: { item: FaqItem }) {
    const [buka, setBuka] = useState(false);
    return (
        <div className="border border-paper-200 rounded-xl overflow-hidden bg-white">
            <button
                onClick={() => setBuka(!buka)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-paper-50 transition-colors"
            >
                <span className="text-sm font-medium text-navy-950">{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-navy-950/40 shrink-0 transition-transform ${buka ? 'rotate-180' : ''}`} />
            </button>
            {buka && (
                <div className="px-4 pb-4 text-sm text-navy-950/60 leading-relaxed border-t border-paper-100 pt-3">
                    {item.a}
                </div>
            )}
        </div>
    );
}

export function FaqAccordion() {
    return (
        <div className="space-y-8">
            {FAQ_DATA.map((kat) => (
                <div key={kat.kategori}>
                    <h2 className="text-sm font-bold text-navy-700 uppercase tracking-wide mb-3">{kat.kategori}</h2>
                    <div className="space-y-2">
                        {kat.items.map((item) => (
                            <AccordionItem key={item.q} item={item} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
