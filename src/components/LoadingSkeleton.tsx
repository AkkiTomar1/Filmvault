export default function LoadingSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6"
      data-testid="loading-skeleton"
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="aspect-[2/3] w-full animate-pulse rounded-xl bg-gray-300" aria-hidden="true" />
      ))}
    </div>
  )
}