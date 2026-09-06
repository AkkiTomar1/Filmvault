interface ErrorStateProps {
  message?: string
  onRetry: () => void
}

export default function ErrorState({ message = 'Something went wrong.', onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 p-10 text-center">
      <span className="text-5xl" aria-hidden="true">
        🎬
      </span>
      <p className="text-lg font-semibold text-gray-700">{message}</p>
      <p className="text-sm text-gray-500">Please try again in a moment.</p>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-blue-600 px-5 py-2 font-bold text-white transition hover:bg-blue-500"
      >
        Retry
      </button>
    </div>
  )
}