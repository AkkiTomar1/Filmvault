import { FaArrowLeft, FaArrowRight } from 'react-icons/fa6'
import { getPageNumbers } from '../lib/pagination'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

const arrowClass =
  'flex h-10 w-10 items-center justify-center rounded-full bg-gray-800/80 text-gray-200 ring-1 ring-white/10 transition enabled:hover:bg-gray-700 enabled:hover:text-white enabled:hover:scale-105 disabled:opacity-30 focus-visible:ring-2 focus-visible:ring-blue-400'

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const size = Math.max(1, totalPages)
  const pages = getPageNumbers(page, size)
  const canPrev = page > 1
  const canNext = page < size

  return (
    <nav aria-label="Pagination" className="mt-10 flex flex-col items-center gap-3">
      <div className="rounded-full bg-gradient-to-r from-blue-500/50 via-indigo-500/40 to-blue-500/50 p-px shadow-xl shadow-indigo-950/30">
        <div className="flex select-none items-center gap-1.5 rounded-full bg-gray-900 px-2 py-1.5">
          <button
            type="button"
            onClick={() => canPrev && onPageChange(page - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
            className={arrowClass}
          >
            <FaArrowLeft aria-hidden="true" className="text-xs" />
          </button>

          <div aria-hidden="true" className="mx-1 h-6 w-px bg-white/10" />

          {pages.map((item) => {
            if (item === 'ellipsis-start' || item === 'ellipsis-end') {
              return (
                <span
                  key={item}
                  aria-hidden="true"
                  className="flex h-10 w-7 items-end justify-center pb-2 text-sm font-medium text-gray-500"
                >
                  …
                </span>
              )
            }

            const active = item === page
            return (
              <button
                key={item}
                type="button"
                onClick={() => !active && onPageChange(item)}
                aria-current={active ? 'page' : undefined}
                aria-label={`Go to page ${item}`}
                className={`flex h-10 min-w-10 items-center justify-center rounded-full px-1.5 text-sm font-bold transition focus-visible:ring-2 focus-visible:ring-blue-400 ${
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50 ring-1 ring-blue-400/60'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                {item}
              </button>
            )
          })}

          <div aria-hidden="true" className="mx-1 h-6 w-px bg-white/10" />

          <button
            type="button"
            onClick={() => canNext && onPageChange(page + 1)}
            disabled={!canNext}
            aria-label="Next page"
            className={arrowClass}
          >
            <FaArrowRight aria-hidden="true" className="text-xs" />
          </button>
        </div>
      </div>

      <p className="text-xs font-medium uppercase tracking-widest text-gray-500">
        Page <span className="font-extrabold text-blue-400">{page}</span>{' '}
        <span aria-hidden="true">/</span> {size}
      </p>
    </nav>
  )
}