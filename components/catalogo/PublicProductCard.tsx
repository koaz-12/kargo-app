import { getThumbnailUrl } from '@/utils/imageUrl';
import { Package } from 'lucide-react';

interface PublicProductCardProps {
    product: {
        id: string;
        name: string;
        image_url: string | null;
        sale_price: number | null;
    }
}

export default function PublicProductCard({ product }: PublicProductCardProps) {
    return (
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
            <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center">
                {product.image_url ? (
                    <img
                        src={getThumbnailUrl(product.image_url, 300, 300)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                ) : (
                    <Package size={32} className="text-slate-300" />
                )}
            </div>
            <div className="p-3 flex flex-col flex-1 justify-between gap-2">
                <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-tight">
                    {product.name}
                </h3>
                <div className="flex items-end justify-between mt-auto">
                    <span className="text-sm font-black text-indigo-600">
                        RD$ {(product.sale_price || 0).toLocaleString()}
                    </span>
                    <button className="bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full hover:bg-slate-800 transition-colors">
                        Comprar
                    </button>
                </div>
            </div>
        </div>
    );
}
