import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const canPrev = page > 1
  const canNext = page < totalPages

  return (
    <nav
      aria-label="Pagination"
      className="mt-8 flex items-center justify-center gap-5 bg-gray-400 p-2.5"
    >
      <button
        type="button"
        onClick={() => canPrev && onPageChange(page - 1)}
        disabled={!canPrev}
        aria-label="Previous page"
        className="rounded p-2 text-white transition enabled:hover:scale-110 disabled:opacity-40"
      >
        <FaArrowLeft />
      </button>

      <span className="font-semibold text-gray-800">
        Page {page} of {Math.max(1, totalPages)}
      </span>

      <button
        type="button"
        onClick={() => canNext && onPageChange(page + 1)}
        disabled={!canNext}
        aria-label="Next page"
        className="rounded p-2 text-white transition enabled:hover:scale-110 disabled:opacity-40"
      >
        <FaArrowRight />
      </button>
    </nav>
  )
}