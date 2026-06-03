type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  visibleCount: number;
  totalCount: number;
  onPageChange: (page: number) => void;
};

export function TablePagination({
  currentPage,
  totalPages,
  visibleCount,
  totalCount,
  onPageChange,
}: TablePaginationProps) {
  return (
    <div className="flex items-center justify-between px-5 py-4 text-[13px] text-[var(--bocar-blue-50)]">
      <p className="m-0">
        Showing {visibleCount} of {totalCount} results
      </p>
      {totalPages > 1 ? (
        <div className="flex items-center gap-3">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={[
                'min-w-[16px] text-[13px] transition hover:text-[var(--bocar-text)]',
                page === currentPage
                  ? 'font-semibold text-[var(--bocar-text)]'
                  : 'text-[var(--bocar-blue-50)]',
              ].join(' ')}
            >
              {page}
            </button>
          ))}
          {totalPages > 2 && (
            <span className="text-[var(--bocar-blue-30)]">...</span>
          )}
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            className="text-[13px] text-[var(--bocar-blue-50)] transition hover:text-[var(--bocar-text)] disabled:opacity-30"
          >
            {'>'}
          </button>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(totalPages)}
            className="text-[13px] text-[var(--bocar-blue-50)] transition hover:text-[var(--bocar-text)] disabled:opacity-30"
          >
            {'»'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
