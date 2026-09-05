'use client';

import { Card } from '@/components/ui/Card';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
} from 'recharts';

type DataBulan = {
    bulan: string;
    offline: number;
    online: number;
    total: number;
    rating: number | null;
    tepatWaktu: number | null;
};

export function StatistikCharts({ data }: { data: DataBulan[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card title="Volume Layanan per Bulan" description="Offline (antrian) vs Online (permintaan data), keduanya berstatus selesai">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DA" />
                            <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} allowDecimals={false} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Legend wrapperStyle={{ fontSize: 12 }} />
                            <Bar dataKey="offline" name="Offline" fill="#1B3A5F" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="online" name="Online" fill="#059669" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card title="Rata-rata Penilaian per Bulan" description="Skala 1–5, dari kedua jalur layanan">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DA" />
                            <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <YAxis domain={[0, 5]} tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                            <Line type="monotone" dataKey="rating" name="Rating" stroke="#E2984D" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            <Card title="Ketepatan Waktu Presensi" description="Persentase petugas yang presensi tanpa kekurangan jam, per bulan" className="lg:col-span-2">
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E7E3DA" />
                            <XAxis dataKey="bulan" tick={{ fontSize: 12, fill: '#6b7280' }} />
                            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#6b7280' }} unit="%" />
                            <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v: number) => `${v}%`} />
                            <Line type="monotone" dataKey="tepatWaktu" name="Tepat Waktu" stroke="#3B82C4" strokeWidth={2.5} dot={{ r: 4 }} connectNulls />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
