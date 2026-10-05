import type { Response } from 'express'
import mongoose from 'mongoose'
import { WatchlistItem } from '../models/WatchlistItem.js'
import type { AuthRequest } from '../middleware/auth.js'

function formatMovie(item: {
  movieId: number
  title: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
}) {
  return {
    id: item.movieId,
    title: item.title,
    overview: item.overview || '',
    poster_path: item.poster_path,
    backdrop_path: item.backdrop_path,
    release_date: item.release_date,
    vote_average: item.vote_average,
    genre_ids: item.genre_ids || [],
    vote_count: 0,
    popularity: 0,
    adult: false,
    original_language: 'en',
  }
}

export async function getWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const userObjectId = new mongoose.Types.ObjectId(req.userId)
    const items = await WatchlistItem.find({ userId: userObjectId }).sort({ createdAt: -1 })
    const movies = items.map(formatMovie)

    res.status(200).json({ success: true, watchlist: movies })
  } catch (error) {
    console.error('Get watchlist error:', error)
    res.status(500).json({ error: 'Failed to fetch watchlist' })
  }
}

export async function addToWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const {
      id,
      title,
      overview,
      poster_path,
      backdrop_path,
      release_date,
      vote_average,
      genre_ids,
    } = req.body

    if (!id || !title) {
      res.status(400).json({ error: 'Movie id and title are required' })
      return
    }

    const userObjectId = new mongoose.Types.ObjectId(req.userId)
    const item = await WatchlistItem.findOneAndUpdate(
      { userId: userObjectId, movieId: Number(id) },
      {
        userId: userObjectId,
        movieId: Number(id),
        title: String(title),
        overview: overview ? String(overview) : '',
        poster_path: poster_path || null,
        backdrop_path: backdrop_path || null,
        release_date: release_date ? String(release_date) : '',
        vote_average: typeof vote_average === 'number' ? vote_average : 0,
        genre_ids: Array.isArray(genre_ids) ? genre_ids : [],
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    )

    if (!item) {
      res.status(500).json({ error: 'Failed to save watchlist item' })
      return
    }

    res.status(201).json({ success: true, movie: formatMovie(item) })
  } catch (error) {
    console.error('Add to watchlist error:', error)
    res.status(500).json({ error: 'Failed to add to watchlist' })
  }
}

export async function removeFromWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const movieId = Number(req.params.movieId)
    if (!movieId) {
      res.status(400).json({ error: 'Valid movieId parameter is required' })
      return
    }

    const userObjectId = new mongoose.Types.ObjectId(req.userId)
    await WatchlistItem.findOneAndDelete({ userId: userObjectId, movieId })

    res.status(200).json({ success: true, removedMovieId: movieId })
  } catch (error) {
    console.error('Remove from watchlist error:', error)
    res.status(500).json({ error: 'Failed to remove from watchlist' })
  }
}

export async function syncWatchlist(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const userObjectId = new mongoose.Types.ObjectId(req.userId)
    const { movies } = req.body

    if (Array.isArray(movies) && movies.length > 0) {
      const operations = movies.map((m) => ({
        updateOne: {
          filter: { userId: userObjectId, movieId: Number(m.id) },
          update: {
            $set: {
              userId: userObjectId,
              movieId: Number(m.id),
              title: String(m.title),
              overview: m.overview ? String(m.overview) : '',
              poster_path: m.poster_path || null,
              backdrop_path: m.backdrop_path || null,
              release_date: m.release_date ? String(m.release_date) : '',
              vote_average: typeof m.vote_average === 'number' ? m.vote_average : 0,
              genre_ids: Array.isArray(m.genre_ids) ? m.genre_ids : [],
            },
          },
          upsert: true,
        },
      }))

      await WatchlistItem.bulkWrite(operations)
    }

    // Return the full updated watchlist
    const allItems = await WatchlistItem.find({ userId: userObjectId }).sort({ createdAt: -1 })
    res.status(200).json({ success: true, watchlist: allItems.map(formatMovie) })
  } catch (error) {
    console.error('Sync watchlist error:', error)
    res.status(500).json({ error: 'Failed to sync watchlist' })
  }
}
