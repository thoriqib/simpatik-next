'use client';

import { useFormStatus } from 'react-dom';

interface SubmitButtonProps {
    children: React.ReactNode;
    className?: string;
    pendingText?: string;
}

/** Tombol submit yang otomatis menampilkan loading state dari Server Action */
export function SubmitButton({ children, className = '', pendingText = 'Menyimpan...' }: SubmitButtonProps) {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className={`bg-[#003580] text-white px-6 py-2.5 rounded-lg text-sm font-semibold
                hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            {pending ? pendingText : children}
        </button>
    );
}
