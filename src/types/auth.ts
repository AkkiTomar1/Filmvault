export const PASSWORD_MIN = 6
export const PASSWORD_MAX = 200
export const EMAIL_MAX = 254
export const DISPLAY_NAME_MAX = 60
export const BIO_MAX = 280

export interface UserProfile {
  id: string
  name: string
  displayName?: string | null
  email: string
  avatar: string
  bio?: string | null
  preferredRegion?: string
  emailVerified?: boolean
  createdAt: string
}

export interface PublicUser {
  id: string
  name?: string
  displayName: string | null
  email: string
  emailVerified?: boolean
  avatar?: string
  bio: string | null
  preferredRegion?: string
  createdAt: string
}

export interface StoredUserAccount extends UserProfile {
  passwordHash: string
}

export interface SignupInput {
  name?: string
  displayName?: string
  email: string
  password: string
  avatar?: string
}

export interface LoginInput {
  email: string
  password: string
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
