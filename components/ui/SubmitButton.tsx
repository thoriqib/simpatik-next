'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
    children: React.ReactNode;
    className?: string;
    pendingText?: string;
    variant?: 'primary' | 'secondary';
}

export function SubmitButton({ children, className = '', pendingText = 'Menyimpan...', variant = 'primary' }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    const base = 'inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100';
    const variants = {
        primary: 'bg-navy-700 text-white hover:bg-navy-800 shadow-soft',
        secondary: 'bg-white text-navy-950 border border-paper-200 hover:bg-paper-50',
    };

    return (
        <button type="submit" disabled={pending} className={`${base} ${variants[variant]} ${className}`}>
            {pending && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
            )}
            {pending ? pendingText : children}
        </button>
    );
}
