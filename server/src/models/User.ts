import mongoose, { Schema, type Document, type Model } from 'mongoose'

export interface IUser extends Document {
  name: string
  email: string
  password: string
  avatar: string
  bio?: string
  preferredRegion?: string
  createdAt: Date
  updatedAt: Date
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    avatar: {
      type: String,
      default: 'film',
    },
    bio: {
      type: String,
      default: '',
    },
    preferredRegion: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  },
)

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
