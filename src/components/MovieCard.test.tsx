import { describe, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MovieCard from './MovieCard'
import type { Movie } from '../types/tmdb'

const movie: Movie = {
  id: 1,
  title: 'The Matrix',
  overview: '',
  poster_path: '/poster.jpg',
  backdrop_path: null,
  release_date: '1999-03-31',
  vote_average: 8.7,
  vote_count: 22000,
  popularity: 500,
  genre_ids: [28],
  adult: false,
  original_language: 'en',
}

function renderCard(overrides?: Partial<ComponentProps<typeof MovieCard>>) {
  const onToggle = vi.fn()
  render(
    <MemoryRouter>
      <MovieCard movie={movie} isInWatchlist={false} onToggle={onToggle} {...overrides} />
    </MemoryRouter>,
  )
  return { onToggle }
}

describe('MovieCard', () => {
  it('renders title, year and formatted rating', () => {
    renderCard()

    expect(screen.getByText('The Matrix')).toBeInTheDocument()
    expect(screen.getByText('(1999)')).toBeInTheDocument()
    expect(screen.getByTestId('rating')).toHaveTextContent('8.7')
  })

  it('links to the movie detail page', () => {
    renderCard()
    expect(screen.getByRole('link')).toHaveAttribute('href', '/movie/1')
  })

  it('fires onToggle when the heart button is clicked', async () => {
    const user = userEvent.setup()
    const { onToggle } = renderCard()

    await user.click(screen.getByTestId('toggle-watchlist'))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows a filled heart when already in the watchlist', () => {
    renderCard({ isInWatchlist: true })
    expect(screen.getByTestId('toggle-watchlist')).toHaveAttribute('aria-pressed', 'true')
  })
})