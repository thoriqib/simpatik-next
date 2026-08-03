import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
}

export function Card({ title, description, children, className = '', ...props }: CardProps) {
    return (
        <div
            className={`bg-white rounded-2xl shadow-soft border border-paper-200 p-6 ${className}`}
            {...props}
        >
            {(title || description) && (
                <div className="mb-5">
                    {title && <h3 className="text-base font-semibold text-navy-950 tracking-tight">{title}</h3>}
                    {description && <p className="text-sm text-navy-950/50 mt-0.5">{description}</p>}
                </div>
            )}
            {children}
        </div>
    );
}
