export interface UserProfile {
  id: string
  name: string
  email: string
  avatar: string
  bio?: string
  preferredRegion?: string
  createdAt: string
}

export interface StoredUserAccount extends UserProfile {
  passwordHash: string
}

export interface SignupInput {
  name: string
  email: string
  password: string
  avatar?: string
}

export interface LoginInput {
  email: string
  password: string
}
