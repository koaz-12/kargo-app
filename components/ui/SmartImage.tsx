import React from 'react';
import { getPublicUrl } from '../../utils/imageUrl';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
    src?: string | null;
    alt?: string;
    fallbackSrc?: string;
}

export default function SmartImage({ src, alt = "", fallbackSrc = "", className, ...props }: SmartImageProps) {
    const finalSrc = src ? getPublicUrl(src) : fallbackSrc;

    if (!finalSrc) {
        return (
            <div className={`bg-slate-100 flex items-center justify-center text-slate-400 ${className}`} {...props as any}>
                <span className="text-[10px]">Sin imagen</span>
            </div>
        );
    }

    return (
        <img 
            src={finalSrc} 
            alt={alt} 
            className={`object-cover ${className || ''}`}
            onError={(e) => {
                if (fallbackSrc) {
                    (e.target as HTMLImageElement).src = fallbackSrc;
                }
            }}
            {...props}
        />
    );
}
