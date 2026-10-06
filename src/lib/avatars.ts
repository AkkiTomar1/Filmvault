export interface AvatarPreset {
  id: string
  label: string
  emoji: string
  gradient: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'film', label: 'Director', emoji: '🎬', gradient: 'from-amber-500 to-red-600' },
  { id: 'popcorn', label: 'Movie Buff', emoji: '🍿', gradient: 'from-yellow-400 to-amber-600' },
  { id: 'camera', label: 'Cinematographer', emoji: '🎥', gradient: 'from-cyan-500 to-blue-600' },
  { id: 'star', label: 'Superstar', emoji: '⭐', gradient: 'from-purple-500 to-indigo-600' },
  { id: 'ticket', label: 'Film Critic', emoji: '🎟️', gradient: 'from-emerald-400 to-teal-600' },
  { id: 'sunglasses', label: 'VIP Premiere', emoji: '🕶️', gradient: 'from-pink-500 to-rose-600' },
]

export function getAvatarPreset(avatarId?: string): AvatarPreset {
  return AVATAR_PRESETS.find((p) => p.id === avatarId) ?? AVATAR_PRESETS[0]
}
