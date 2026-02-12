import React from 'react';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
}) => {
    const ActionButton = () => {
        if (!actionLabel) return null;

        const buttonClasses = "mt-4 px-6 py-2.5 bg-slate-900 text-white rounded-xl font-semibold hover:bg-slate-800 transition-all active:scale-95 shadow-lg";

        if (actionHref) {
            return (
                <Link href={actionHref} className={buttonClasses}>
                    {actionLabel}
                </Link>
            );
        }

        if (onAction) {
            return (
                <button onClick={onAction} className={buttonClasses}>
                    {actionLabel}
                </button>
            );
        }

        return null;
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <Icon size={32} className="text-slate-400" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
            <p className="text-sm text-slate-500 max-w-xs mb-2">{description}</p>
            <ActionButton />
        </div>
    );
};
