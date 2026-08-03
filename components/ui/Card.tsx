import { HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    title?: string;
}

export function Card({ title, children, className = '', ...props }: CardProps) {
    return (
        <div className={`bg-white rounded-xl shadow-sm border border-gray-100 p-6 ${className}`} {...props}>
            {title && <h3 className="text-base font-semibold text-gray-800 mb-4">{title}</h3>}
            {children}
        </div>
    );
}
