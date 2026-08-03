'use client';

import { ReactNode } from 'react';

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-5">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }}>
            <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
                <div className="text-center mb-5">
                    <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{message}</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200 transition">Batal</button>
                    <button onClick={onConfirm} disabled={pending} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition disabled:opacity-50">
                        {pending ? 'Menghapus...' : 'Ya, Hapus'}
                    </button>
                </div>
            </div>
        </div>
    );
}
