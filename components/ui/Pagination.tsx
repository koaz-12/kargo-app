import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    loading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    loading = false
}) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);

    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200">
            {/* Info */}
            <div className="flex-1 flex justify-between sm:hidden">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Anterior
                </button>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-slate-300 text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Siguiente
                </button>
            </div>

            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between w-full">
                <div>
                    <p className="text-sm text-slate-700">
                        Mostrando <span className="font-bold">{startItem}</span> a{' '}
                        <span className="font-bold">{endItem}</span> de{' '}
                        <span className="font-bold">{totalItems}</span> productos
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || loading}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Página anterior"
                    >
                        <ChevronLeft size={18} />
                    </button>

                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            // Show first, last, current, and adjacent pages
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-bold transition-all ${page === currentPage
                                                ? 'bg-slate-900 text-white'
                                                : 'border border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-1 text-slate-400">...</span>;
                            }
                            return null;
                        })}
                    </div>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || loading}
                        className="p-2 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        title="Página siguiente"
                    >
                        <ChevronRight size={18} />
                    </button>
                </div>
            </div>
        </div>
    );
};
