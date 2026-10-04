export const PASSWORD_MIN = 10
export const PASSWORD_MAX = 200
export const EMAIL_MAX = 254
export const DISPLAY_NAME_MAX = 60
export const BIO_MAX = 280

export interface PublicUser {
  id: string
  email: string
  emailVerified: boolean
  displayName: string | null
  bio: string | null
  createdAt: string
}

export interface AuthSession {
  user: PublicUser
  accessToken: string
  refreshToken: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface OkResponse {
  ok: true
}

export interface WatchlistItem {
  movieId: number
  title: string
  posterPath: string | null
  addedAt: string
}

export interface HistoryEntry {
  movieId: number
  title: string
  posterPath: string | null
  viewedAt: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface SignupInput {
  email: string
  password: string
  displayName?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  password: string
}

export interface ResetPasswordInput {
  token: string
  password: string
}

export interface UpdateProfileInput {
  displayName?: string | null
  bio?: string | null
}
