import { STATUS_BADGE } from '@/lib/utils';

export function Badge({ status }: { status: string }) {
    const info = STATUS_BADGE[status] ?? { label: status, className: 'bg-gray-100 text-gray-600' };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${info.className}`}>
            {info.label}
        </span>
    );
}
