'use client';

import { ReactNode } from 'react';
import { X } from 'lucide-react';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm animate-in fade-in duration-150"
            onClick={onClose}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-card max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-navy-950 tracking-tight">{title}</h3>
                    <button onClick={onClose} className="text-navy-950/40 hover:text-navy-950 hover:bg-paper-100 rounded-xl p-1 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

export function ConfirmModal({
    open, onClose, onConfirm, title, message, pending,
}: {
    open: boolean; onClose: () => void; onConfirm: () => void; title: string; message: string; pending?: boolean;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-card max-w-sm w-full p-6">
                <div className="text-center mb-5">
                    <h3 className="text-lg font-semibold text-navy-950">{title}</h3>
                    <p className="text-sm text-navy-950/50 mt-1.5">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-paper-100 text-navy-950 py-2.5 rounded-xl text-sm font-semibold hover:bg-paper-200 transition-colors">Batal</button>
                    <button onClick={onConfirm} disabled={pending} className="flex-1 bg-rose-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors disabled:opacity-50">
                        {pending ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}
