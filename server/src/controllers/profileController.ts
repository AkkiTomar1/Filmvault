import type { Response } from 'express'
import { User } from '../models/User.js'
import type { AuthRequest } from '../middleware/auth.js'

export async function updateProfile(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { name, avatar, bio, preferredRegion } = req.body

    const updates: Record<string, string> = {}
    if (typeof name === 'string' && name.trim()) updates.name = name.trim()
    if (typeof avatar === 'string') updates.avatar = avatar
    if (typeof bio === 'string') updates.bio = bio
    if (typeof preferredRegion === 'string') updates.preferredRegion = preferredRegion

    const updatedUser = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password')

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.status(200).json({
      success: true,
      user: {
        id: updatedUser._id.toString(),
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        preferredRegion: updatedUser.preferredRegion,
        createdAt: updatedUser.createdAt,
      },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}
