import { Link } from 'react-router-dom'
import ErrorState from './ErrorState'

export default function RouteError({
  message = "We couldn't load this page.",
}: {
  message?: string
}) {
  return (
    <div className="flex flex-col items-center gap-4 p-16">
      <ErrorState message={message} onRetry={() => window.location.reload()} />
      <Link to="/" className="text-blue-600 underline">
        Back to home
      </Link>
    </div>
  )
}