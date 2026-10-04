export interface PublicUser {
  id: string
  email: string
  emailVerified: boolean
  displayName: string | null
  bio: string | null
  createdAt: string
}

/**
 * The only shape of a user that ever leaves the API. Keeps `passwordHash`,
 * `tokenVersion`, and every token row out of responses.
 */
export function toPublicUser(user: {
  id: string
  email: string
  emailVerified: Date | null
  displayName: string | null
  bio: string | null
  createdAt: Date
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    emailVerified: user.emailVerified !== null,
    displayName: user.displayName,
    bio: user.bio,
    createdAt: user.createdAt.toISOString(),
  }
}