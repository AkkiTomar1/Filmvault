export default function LoadingSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="flex flex-row flex-wrap justify-around gap-4 p-3" data-testid="loading-skeleton">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="h-[42vh] w-[160px] animate-pulse rounded-xl bg-gray-300 sm:h-[48vh] sm:w-[189px]"
          aria-hidden="true"
        />
      ))}
    </div>
  )
}