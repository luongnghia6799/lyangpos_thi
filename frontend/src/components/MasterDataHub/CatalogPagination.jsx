import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CatalogPagination({
    currentPage = 1,
    totalItems = 0,
    pageSize = 20,
    onPageChange,
    itemLabel = "mục"
}) {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;
    if (totalPages <= 1) return null;

    const startIdx = (currentPage - 1) * pageSize + 1;
    const endIdx = Math.min(currentPage * pageSize, totalItems);

    // Calculate smart page numbers window
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1);
            if (currentPage > 3) pages.push('...');
            
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);
            for (let i = start; i <= end; i++) pages.push(i);
            
            if (currentPage < totalPages - 2) pages.push('...');
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-stone-200/60 dark:border-white/5 text-xs">
            <div className="text-stone-500 dark:text-stone-400 font-medium text-[11px] sm:text-xs">
                Hiển thị <span className="font-bold text-stone-800 dark:text-stone-200">{startIdx}</span> - <span className="font-bold text-stone-800 dark:text-stone-200">{endIdx}</span> trên tổng số <span className="font-bold text-emerald-700 dark:text-emerald-400">{totalItems}</span> {itemLabel}
            </div>

            <div className="flex items-center gap-1">
                {/* First page */}
                <button
                    type="button"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Trang đầu"
                >
                    <ChevronsLeft size={16} />
                </button>

                {/* Prev page */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Trang trước"
                >
                    <ChevronLeft size={16} />
                </button>

                {/* Page numbers */}
                <div className="flex items-center gap-1 mx-1">
                    {getPageNumbers().map((p, idx) => {
                        if (p === '...') {
                            return (
                                <span key={`ellipsis-${idx}`} className="px-1 text-stone-400 font-bold">
                                    ...
                                </span>
                            );
                        }
                        const isActive = p === currentPage;
                        return (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                className={cn(
                                    "min-w-[32px] h-8 px-2 rounded-xl text-xs font-bold transition-all cursor-pointer",
                                    isActive
                                        ? "bg-emerald-700 dark:bg-emerald-600 text-white shadow-xs font-black scale-105"
                                        : "text-stone-600 dark:text-stone-300 hover:bg-stone-200/60 dark:hover:bg-white/5"
                                )}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Next page */}
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Trang sau"
                >
                    <ChevronRight size={16} />
                </button>

                {/* Last page */}
                <button
                    type="button"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-xl text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-200/50 dark:hover:bg-white/5 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                    title="Trang cuối"
                >
                    <ChevronsRight size={16} />
                </button>
            </div>
        </div>
    );
}
