import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../context/ToastContext'
import { WatchlistProvider } from '../context/WatchlistContext'
import WatchlistPage from './WatchlistPage'
import type { Movie } from '../types/tmdb'

vi.mock('../api/tmdb', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/tmdb')>()
  return {
    ...actual,
    getGenres: vi.fn().mockResolvedValue([
      { id: 28, name: 'Action' },
      { id: 80, name: 'Crime' },
    ]),
  }
})

const actionMovie: Movie = {
  id: 1,
  title: 'Alien',
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2010-06-01',
  vote_average: 7.5,
  vote_count: 100,
  popularity: 300,
  genre_ids: [28],
  adult: false,
  original_language: 'en',
}

const crimeMovie: Movie = {
  id: 2,
  title: 'Dune',
  overview: '',
  poster_path: null,
  backdrop_path: null,
  release_date: '2021-10-22',
  vote_average: 9.1,
  vote_count: 200,
  popularity: 800,
  genre_ids: [80],
  adult: false,
  original_language: 'en',
}

function seedWatchlist(movies: Movie[]) {
  localStorage.setItem('filmvault.watchlist', JSON.stringify(movies))
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <WatchlistProvider>
          <WatchlistPage />
        </WatchlistProvider>
      </ToastProvider>
    </MemoryRouter>,
  )
}

async function getRows(): Promise<HTMLTableRowElement[]> {
  const table = await screen.findByTestId('watchlist-table')
  return within(table).getAllByRole('row') as HTMLTableRowElement[]
}

describe('WatchlistPage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows an empty state with a call to action when nothing is saved', () => {
    renderPage()
    expect(screen.getByText('Your watchlist is empty')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Explore movies' })).toBeInTheDocument()
  })

  it('renders saved movies and resolves genre ids to names', async () => {
    seedWatchlist([actionMovie, crimeMovie])
    renderPage()

    expect(await screen.findByText('Alien')).toBeInTheDocument()
    expect(screen.getByText('Dune')).toBeInTheDocument()
    const table = screen.getByTestId('watchlist-table')
    expect(within(table).getAllByText('Action').length).toBeGreaterThanOrEqual(1)
    expect(within(table).getAllByText('Crime').length).toBeGreaterThanOrEqual(1)
    expect(screen.queryByText('28')).not.toBeInTheDocument()
    expect(screen.queryByText('80')).not.toBeInTheDocument()
  })

  it('formats ratings to one decimal place', async () => {
    seedWatchlist([actionMovie])
    renderPage()
    expect(await screen.findByText('7.5')).toBeInTheDocument()
  })

  it('filters by genre when a pill is clicked', async () => {
    const user = userEvent.setup()
    seedWatchlist([actionMovie, crimeMovie])
    renderPage()
    await screen.findByText('Alien')

    await user.click(screen.getByRole('button', { name: 'Action' }))

    expect(screen.getByText('Alien')).toBeInTheDocument()
    expect(screen.queryByText('Dune')).not.toBeInTheDocument()
  })

  it('filters by search query', async () => {
    const user = userEvent.setup()
    seedWatchlist([actionMovie, crimeMovie])
    renderPage()
    await screen.findByText('Alien')

    await user.type(screen.getByLabelText('Search watchlist'), 'Dune')

    await waitFor(() => {
      expect(screen.queryByText('Alien')).not.toBeInTheDocument()
    })
    expect(screen.getByText('Dune')).toBeInTheDocument()
  })

  it('sorts by rating when selected', async () => {
    seedWatchlist([actionMovie, crimeMovie])
    renderPage()

    const rows = await getRows()
    expect(rows[1].textContent).toContain('Alien')

    const user = userEvent.setup()
    await user.selectOptions(screen.getByLabelText('Sort watchlist'), 'rating')

    const sortedRows = await getRows()
    expect(sortedRows[1].textContent).toContain('Dune')
    expect(sortedRows[2].textContent).toContain('Alien')
  })

  it('removes a movie when Delete is clicked', async () => {
    const user = userEvent.setup()
    seedWatchlist([actionMovie, crimeMovie])
    renderPage()
    await screen.findByText('Alien')

    const alienRow = screen.getByText('Alien').closest('tr')!
    await user.click(within(alienRow).getByRole('button', { name: 'Delete' }))

    expect(screen.queryByText('Alien')).not.toBeInTheDocument()
    expect(screen.getByText('Dune')).toBeInTheDocument()
  })

  it('clears the whole watchlist', async () => {
    const user = userEvent.setup()
    seedWatchlist([actionMovie, crimeMovie])
    renderPage()
    await screen.findByText('Alien')

    await user.click(screen.getByRole('button', { name: 'Clear all' }))

    expect(await screen.findByText('Your watchlist is empty')).toBeInTheDocument()
  })

  it('renders a row even when a saved movie has no genre_ids (no crash)', async () => {
    const noGenres = {
      ...actionMovie,
      id: 9,
      title: 'Legacy',
      genre_ids: undefined,
    } as unknown as Movie
    seedWatchlist([noGenres])
    renderPage()

    expect(await screen.findByText('Legacy')).toBeInTheDocument()
    const table = screen.getByTestId('watchlist-table')
    expect(within(table).getByText('—')).toBeInTheDocument()
  })
})