import { LayoutDashboard, Clock, Ticket, MessageSquareWarning, CalendarDays, Users, ShieldCheck, Star, Trophy, ClipboardList, Link2 } from 'lucide-react';

type BantuanItem = { icon: React.ElementType; judul: string; isi: string };

const BANTUAN_PETUGAS: BantuanItem[] = [
    {
        icon: Clock,
        judul: 'Presensi Masuk & Keluar',
        isi: 'Klik "Presensi Masuk" di Dashboard saat mulai piket, dan "Presensi Keluar" setelah selesai. Hanya bisa dilakukan pada hari Anda memang terjadwal. Setelah presensi keluar tercatat, Anda tidak bisa mengubahnya sendiri — kalau ada kesalahan, minta admin mengoreksi lewat menu Jadwal Piket.',
    },
    {
        icon: Ticket,
        judul: 'Melayani Antrian Tatap Muka',
        isi: 'Panggil nomor antrian berikutnya dari Dashboard, tandai "Mulai Layani" saat pengunjung datang, lalu "Selesai" setelah pelayanan tuntas. Status otomatis tersinkron ke layar display antrian secara real-time.',
    },
    {
        icon: MessageSquareWarning,
        judul: 'Menangani Permintaan Data Online',
        isi: 'Buka menu Permintaan Data. Klik "Tindak Lanjuti" pada permintaan berstatus Baru untuk jadi penanggung jawab. Balas lewat kotak chat — percakapan cuma aktif pada jam pelayanan. Klik "Tandai Selesai" setelah kebutuhan pengunjung terpenuhi.',
    },
    {
        icon: CalendarDays,
        judul: 'Melihat Jadwal',
        isi: '"Jadwal Saya" menampilkan jadwal piket pribadi Anda per bulan. "Jadwal Semua Petugas" menampilkan jadwal tim lengkap per minggu, berguna untuk koordinasi.',
    },
];

const BANTUAN_ADMIN: BantuanItem[] = [
    {
        icon: Users,
        judul: 'Kelola Data Petugas',
        isi: 'Tambah/edit/hapus akun petugas satu per satu, atau impor massal lewat CSV. Setiap akun baru otomatis dapat email & password sementara.',
    },
    {
        icon: ShieldCheck,
        judul: 'Pengaturan Akses',
        isi: 'Naikkan petugas jadi admin, atau turunkan admin jadi petugas biasa. Sistem mencegah akses admin kosong sama sekali — admin terakhir tidak bisa diturunkan sendiri.',
    },
    {
        icon: CalendarDays,
        judul: 'Kelola Jadwal & Presensi',
        isi: 'Susun jadwal piket manual/impor Excel di menu Jadwal Piket. Bisa koreksi waktu presensi petugas yang keliru, tandai status Izin/Sakit/Alpha dengan keterangan, dan tandai hari libur nasional.',
    },
    {
        icon: Star,
        judul: 'Penilaian & Petugas Terbaik',
        isi: '"Semua Penilaian" menampilkan rekap penilaian dari layanan tatap muka maupun online. "Petugas Terbaik" menghitung skor triwulanan otomatis berdasarkan ketepatan presensi, volume layanan, dan rata-rata penilaian — objektif, bukan subjektif.',
    },
    {
        icon: ClipboardList,
        judul: 'Laporan',
        isi: 'Tersedia laporan Antrian, Rekap Layanan (perbandingan offline vs online per petugas), Penilaian, dan Presensi — semua bisa difilter per periode untuk keperluan pelaporan ke pimpinan.',
    },
    {
        icon: Link2,
        judul: 'Kelola Pesta Koja',
        isi: 'Tambah, edit, hapus, aktif/nonaktifkan, dan urutkan daftar link layanan yang tampil di halaman Pesta Koja publik — semua lewat antarmuka, tanpa perlu ubah kode.',
    },
];

function BantuanCard({ item }: { item: BantuanItem }) {
    const Icon = item.icon;
    return (
        <div className="bg-white rounded-xl border border-paper-200 p-4 flex gap-3.5">
            <div className="w-9 h-9 rounded-lg bg-azure-500/10 text-azure-500 flex items-center justify-center shrink-0">
                <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
                <div className="font-semibold text-navy-950 text-sm mb-1">{item.judul}</div>
                <p className="text-xs text-navy-950/60 leading-relaxed">{item.isi}</p>
            </div>
        </div>
    );
}

/**
 * Konten bantuan staf — dipakai bersama oleh /admin/bantuan dan
 * /petugas/bantuan (pola sama dengan JadwalPetugasView: satu komponen,
 * dua route wrapper, hindari duplikasi). `peran` menentukan urutan
 * tampilan (petugas lihat bagian petugas dulu, admin lihat keduanya
 * dengan bagian admin di atas).
 */
export function BantuanStafContent({ peran }: { peran: 'admin' | 'petugas' }) {
    const urutan = peran === 'admin'
        ? [{ label: 'Untuk Admin', items: BANTUAN_ADMIN }, { label: 'Untuk Petugas', items: BANTUAN_PETUGAS }]
        : [{ label: 'Untuk Petugas', items: BANTUAN_PETUGAS }];

    return (
        <div className="space-y-8">
            {urutan.map((grup) => (
                <div key={grup.label}>
                    <h2 className="text-sm font-bold text-navy-700 uppercase tracking-wide mb-3">{grup.label}</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {grup.items.map((item) => (
                            <BantuanCard key={item.judul} item={item} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
