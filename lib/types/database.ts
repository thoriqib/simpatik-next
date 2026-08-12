// Tipe TypeScript yang merefleksikan skema Supabase (supabase/migrations/0001_init.sql)
// Bisa digantikan hasil `supabase gen types typescript` untuk auto-sync.

export type Role = 'admin' | 'petugas';
export type StatusJadwal = 'terjadwal' | 'hadir' | 'izin' | 'sakit' | 'alpha';
export type StatusAntrian = 'menunggu' | 'dipanggil' | 'dilayani' | 'selesai' | 'batal';
export type StatusPengaduan = 'baru' | 'diproses' | 'selesai';

export interface Profile {
    id: string;
    name: string;
    email: string;
    role: Role;
    created_at: string;
}

export interface ShiftPiket {
    id: number;
    nama_shift: string;
    jam_mulai: string;
    jam_selesai: string;
    is_aktif: boolean;
    created_at: string;
}

export interface JenisLayanan {
    id: number;
    kode: string;
    nama_layanan: string;
    deskripsi: string | null;
    is_aktif: boolean;
    created_at: string;
}

export interface JadwalPiket {
    id: number;
    user_id: string;
    shift_id: number;
    tanggal: string;
    status: StatusJadwal;
    created_at: string;
    profiles?: Profile;
    shift_piket?: ShiftPiket;
    presensi?: Presensi[] | null;
}

export interface Presensi {
    id: number;
    user_id: string;
    jadwal_piket_id: number;
    waktu_masuk: string | null;
    waktu_keluar: string | null;
    terlambat_menit: number;
    pulang_awal_menit: number;
    kekurangan_menit: number;
    created_at: string;
}

export interface Antrian {
    id: number;
    kode_antrian: string;
    jenis_layanan_id: number;
    petugas_id: string | null;
    nama_pengunjung: string;
    no_hp: string | null;
    email: string | null;
    tanggal: string;
    nomor_urut: number;
    status: StatusAntrian;
    waktu_panggil: string | null;
    waktu_mulai_layanan: string | null;
    waktu_selesai: string | null;
    created_at: string;
    jenis_layanan?: JenisLayanan;
    profiles?: Profile | null;
    penilaian?: Penilaian[] | null;
}

export interface Penilaian {
    id: number;
    antrian_id: number;
    petugas_id: string;
    nilai: number;
    komentar: string | null;
    created_at: string;
    profiles?: Profile;
    antrian?: Antrian;
}

export interface Pengaduan {
    id: number;
    subjek: string;
    isi_pengaduan: string;
    lampiran_path: string | null;
    status: StatusPengaduan;
    tanggapan: string | null;
    ditangani_oleh: string | null;
    ditanggapi_pada: string | null;
    created_at: string;
    profiles?: Profile | null;
}

export interface JadwalPublik {
    id: number;
    tanggal: string;
    status: StatusJadwal;
    nama_petugas: string;
    shift_id: number;
    nama_shift: string;
    jam_mulai: string;
    jam_selesai: string;
}

export interface HariLibur {
    id: number;
    tanggal: string;
    keterangan: string;
    created_at: string;
}

export type KegunaanData = 'kedinasan' | 'pribadi';
export type StatusPermintaanData = 'baru' | 'diproses' | 'selesai' | 'dibatalkan';

export interface PermintaanData {
    id: number;
    token: string;
    nama_lengkap: string;
    instansi: string;
    kegunaan_data: KegunaanData;
    email: string;
    no_hp: string;
    kebutuhan_data: string;
    status: StatusPermintaanData;
    tanggapan: string | null;
    ditangani_oleh: string | null;
    ditanggapi_pada: string | null;
    created_at: string;
    profiles?: Profile | null;
}

export type PengirimPesan = 'pengunjung' | 'petugas';

export interface PermintaanDataPesan {
    id: number;
    permintaan_data_id: number;
    pengirim: PengirimPesan;
    petugas_id: string | null;
    pesan: string;
    created_at: string;
    petugas_nama?: string | null; // hanya terisi dari function get_permintaan_data_publik
}

/** Bentuk hasil RPC get_permintaan_data_publik (dipetakan dari JSON Postgres). */
export interface PermintaanDataPublikResult {
    id: number;
    nama_lengkap: string;
    instansi: string;
    kegunaan_data: KegunaanData;
    kebutuhan_data: string;
    status: StatusPermintaanData;
    created_at: string;
    ditanggapi_pada: string | null;
    petugas_nama: string | null;
    pesan: PermintaanDataPesan[];
}
