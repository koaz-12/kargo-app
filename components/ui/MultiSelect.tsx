'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface MultiSelectProps {
    options: { value: string; label: string }[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
    options,
    selected,
    onChange,
    placeholder = 'Seleccionar...',
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleOption = (value: string) => {
        if (selected.includes(value)) {
            onChange(selected.filter(v => v !== value));
        } else {
            onChange([...selected, value]);
        }
    };

    const removeOption = (value: string, e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(selected.filter(v => v !== value));
    };

    const selectedLabels = options
        .filter(opt => selected.includes(opt.value))
        .map(opt => opt.label);

    return (
        <div className="relative">
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-left text-sm focus:ring-2 focus:ring-slate-900 outline-none shadow-sm hover:bg-slate-50 transition-colors"
            >
                {selected.length === 0 ? (
                    <span className="text-slate-400">{placeholder}</span>
                ) : (
                    <div className="flex flex-wrap gap-1">
                        {selectedLabels.map((label, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1 bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full"
                            >
                                {label}
                                <button
                                    onClick={(e) => {
                                        const value = options.find(o => o.label === label)?.value;
                                        if (value) removeOption(value, e);
                                    }}
                                    className="hover:bg-slate-700 rounded-full p-0.5 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />
                    <div className="absolute z-20 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-auto">
                        {options.map(option => (
                            <label
                                key={option.value}
                                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <input
                                    type="checkbox"
                                    checked={selected.includes(option.value)}
                                    onChange={() => toggleOption(option.value)}
                                    className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-2 focus:ring-slate-900"
                                />
                                <span className="text-sm text-slate-700">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};
