import { InputHTMLAttributes } from 'react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export function FormInput({ label, error, required, className = '', ...props }: FormInputProps) {
    return (
        <div className="mb-4">
            <label className="block text-sm font-medium text-navy-950 mb-1.5">
                {label} {required && <span className="text-rose-500">*</span>}
            </label>
            <input
                required={required}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-navy-950 placeholder:text-navy-950/30
                    transition-colors focus:outline-none focus:ring-2 focus:ring-azure-500/40 focus:border-azure-500
                    ${error ? 'border-rose-300 bg-rose-50/50' : 'border-paper-200 bg-white'} ${className}`}
                {...props}
            />
            {error && <p className="text-rose-500 text-xs mt-1.5">{error}</p>}
        </div>
    );
}
