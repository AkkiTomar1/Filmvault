import argon2 from 'argon2'

const HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
} as const

export function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, HASH_OPTIONS)
}

export async function verifyPassword(digest: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(digest, plain)
  } catch {
    return false
  }
}

const DUMMY_HASH = hashPassword(`fv-dummy-`)

export async function equalizeLoginTiming(plain: string): Promise<void> {
  const digest = await DUMMY_HASH
  await verifyPassword(digest, plain)
}
