const STATUS_BADGE: Record<string, { label: string; className: string }> = {
    menunggu:  { label: 'Menunggu',  className: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' },
    dipanggil: { label: 'Dipanggil', className: 'bg-azure-500/10 text-azure-500 ring-1 ring-azure-500/20' },
    dilayani:  { label: 'Dilayani',  className: 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20' },
    selesai:   { label: 'Selesai',   className: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' },
    batal:     { label: 'Batal',     className: 'bg-navy-950/5 text-navy-950/40 ring-1 ring-navy-950/10' },
    baru:      { label: 'Baru',      className: 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20' },
    diproses:  { label: 'Diproses',  className: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' },
    hadir:     { label: 'Hadir',     className: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20' },
    izin:      { label: 'Izin',      className: 'bg-azure-500/10 text-azure-500 ring-1 ring-azure-500/20' },
    sakit:     { label: 'Sakit',     className: 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20' },
    alpha:     { label: 'Alpha',     className: 'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20' },
    terjadwal: { label: 'Terjadwal', className: 'bg-navy-950/5 text-navy-950/50 ring-1 ring-navy-950/10' },
};

export function Badge({ status }: { status: string }) {
    const info = STATUS_BADGE[status] ?? { label: status, className: 'bg-navy-950/5 text-navy-950/50 ring-1 ring-navy-950/10' };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${info.className}`}>
            {info.label}
        </span>
    );
}
