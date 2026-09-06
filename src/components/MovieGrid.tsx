import type { Movie } from '../types/tmdb'
import MovieCard from './MovieCard'

interface MovieGridProps {
  movies: Movie[]
  isInWatchlist: (id: number) => boolean
  onToggle: (movie: Movie) => void
}

export default function MovieGrid({ movies, isInWatchlist, onToggle }: MovieGridProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          isInWatchlist={isInWatchlist(movie.id)}
          onToggle={() => onToggle(movie)}
        />
      ))}
    </div>
  )
}