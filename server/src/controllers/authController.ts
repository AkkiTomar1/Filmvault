import type { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import type { AuthRequest } from '../middleware/auth.js'

function generateToken(userId: string, email: string): string {
  const secret = process.env.JWT_SECRET || 'filmvault_default_secret_key'
  return jwt.sign({ sub: userId, email, iss: 'filmvault-app' }, secret, {
    expiresIn: '7d',
  })
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, password, avatar } = req.body

    const trimmedName = name?.trim()
    const trimmedEmail = email?.trim().toLowerCase()
    const trimmedPassword = password?.trim()

    if (!trimmedName) {
      res.status(400).json({ error: 'Name is required' })
      return
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      res.status(400).json({ error: 'Valid email address is required' })
      return
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' })
      return
    }

    const existingUser = await User.findOne({ email: trimmedEmail })
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists' })
      return
    }

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(trimmedPassword, salt)

    const newUser = await User.create({
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      avatar: avatar || 'film',
      bio: '',
      preferredRegion: '',
    })

    const token = generateToken(newUser._id.toString(), newUser.email)

    res.status(201).json({
      success: true,
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        avatar: newUser.avatar,
        bio: newUser.bio,
        preferredRegion: newUser.preferredRegion,
        createdAt: newUser.createdAt,
      },
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Server error during registration' })
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password } = req.body

    const trimmedEmail = email?.trim().toLowerCase()
    const trimmedPassword = password?.trim()

    if (!trimmedEmail || !trimmedPassword) {
      res.status(400).json({ error: 'Email and password are required' })
      return
    }

    const user = await User.findOne({ email: trimmedEmail })
    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const isMatch = await bcrypt.compare(trimmedPassword, user.password)
    if (!isMatch) {
      res.status(401).json({ error: 'Invalid email or password' })
      return
    }

    const token = generateToken(user._id.toString(), user.email)

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        preferredRegion: user.preferredRegion,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Server error during login' })
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const user = await User.findById(req.userId).select('-password')
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        preferredRegion: user.preferredRegion,
        createdAt: user.createdAt,
      },
    })
  } catch (error) {
    console.error('GetMe error:', error)
    res.status(500).json({ error: 'Server error fetching user profile' })
  }
}
