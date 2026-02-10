'use client';

interface TablePaginationProps {
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function TablePagination({
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const clampedPage = Math.min(Math.max(currentPage, 1), totalPages);
  const rangeStart = totalCount === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(clampedPage * pageSize, totalCount);

  return (
    <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
      <span>
        총 {totalCount}건{totalCount > 0 && ` · ${rangeStart}-${rangeEnd} 표시`}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPageChange(clampedPage - 1)}
          disabled={clampedPage <= 1}
          className="h-7 rounded border border-input px-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          이전
        </button>
        <span className="px-1">
          {clampedPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(clampedPage + 1)}
          disabled={clampedPage >= totalPages}
          className="h-7 rounded border border-input px-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          다음
        </button>
      </div>
    </div>
  );
}
