import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  totalItems: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export function getPageSize(isMobile: boolean) {
  return isMobile ? 30 : 50;
}

export { useIsMobile };

export default function Pagination({ totalItems, currentPage, onPageChange }: PaginationProps) {
  const isMobile = useIsMobile();
  const pageSize = getPageSize(isMobile);
  const totalPages = Math.ceil(totalItems / pageSize);

  if (totalPages <= 1) return null;

  const buildPages = () => {
    const pages: (number | 'dots')[] = [];
    const maxVisible = isMobile ? 5 : 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('dots');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push('dots');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <nav className="flex items-center justify-center gap-1.5 py-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed
          text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <ChevronLeft size={16} />
        <span className="hidden sm:inline">Previous</span>
      </button>

      <div className="flex items-center gap-1">
        {buildPages().map((page, idx) =>
          page === 'dots' ? (
            <span key={`dots-${idx}`} className="w-8 text-center text-gray-400 dark:text-gray-500 text-sm">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] h-9 px-2 text-sm font-medium rounded-lg transition-all ${
                page === currentPage
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed
          text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight size={16} />
      </button>
    </nav>
  );
}
