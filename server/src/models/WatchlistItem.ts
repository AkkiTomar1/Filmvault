import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface IWatchlistItem extends Document {
  userId: mongoose.Types.ObjectId
  movieId: number
  title: string
  overview?: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  genre_ids: number[]
  createdAt: Date
}

const WatchlistItemSchema = new Schema<IWatchlistItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    movieId: {
      type: Number,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    overview: {
      type: String,
      default: '',
    },
    poster_path: {
      type: String,
      default: null,
    },
    backdrop_path: {
      type: String,
      default: null,
    },
    release_date: {
      type: String,
      default: '',
    },
    vote_average: {
      type: Number,
      default: 0,
    },
    genre_ids: {
      type: [Number],
      default: [],
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  },
)

// Ensure one user cannot add duplicate movies to their watchlist
WatchlistItemSchema.index({ userId: 1, movieId: 1 }, { unique: true })

export const WatchlistItem: Model<IWatchlistItem> =
  mongoose.models.WatchlistItem ||
  mongoose.model<IWatchlistItem>('WatchlistItem', WatchlistItemSchema)
