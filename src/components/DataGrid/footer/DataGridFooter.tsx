interface DataGridFooterProps {
  page: number;
  pageCount: number;
  pageSize: number;
  totalRows: number;
  onPageChange: (page: number) => void;
}

export function DataGridFooter({
  page,
  pageCount,
  pageSize,
  totalRows,
  onPageChange,
}: DataGridFooterProps) {
  const firstRow = totalRows === 0 ? 0 : page * pageSize + 1;
  const lastRow = Math.min(totalRows, (page + 1) * pageSize);

  return (
    <div className="pdg__footer">
      <span className="pdg__footer-info" aria-live="polite">
        {totalRows === 0 ? 'No rows' : `${firstRow}–${lastRow} of ${totalRows}`}
      </span>
      <nav className="pdg__footer-pagination" aria-label="Pagination">
        <button
          type="button"
          className="pdg__pagination-button"
          aria-label="Previous page"
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
        >
          ‹
        </button>
        <span className="pdg__pagination-page">
          Page {page + 1} of {pageCount}
        </span>
        <button
          type="button"
          className="pdg__pagination-button"
          aria-label="Next page"
          disabled={page >= pageCount - 1}
          onClick={() => onPageChange(page + 1)}
        >
          ›
        </button>
      </nav>
    </div>
  );
}
