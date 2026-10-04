import { client } from './client'
import type {
  AuthSession,
  ChangePasswordInput,
  LoginInput,
  OkResponse,
  PublicUser,
  ResetPasswordInput,
  SignupInput,
  TokenPair,
  UpdateProfileInput,
} from '../types/auth'

export const authApi = {
  register: (input: SignupInput) =>
    client.post<AuthSession>('/auth/register', input).then((r) => r.data),
  login: (input: LoginInput) =>
    client.post<AuthSession>('/auth/login', input).then((r) => r.data),
  refresh: (refreshToken: string) =>
    client.post<TokenPair>('/auth/refresh', { refreshToken }).then((r) => r.data),
  logout: (refreshToken: string) =>
    client.post<void>('/auth/logout', { refreshToken }),
  me: () =>
    client.get<{ user: PublicUser }>('/auth/me').then((r) => r.data.user),
  verifyEmail: (token: string) =>
    client.post<{ user: PublicUser }>('/auth/verify-email', { token }).then((r) => r.data.user),
  resendVerification: (email: string) =>
    client.post<OkResponse>('/auth/resend-verification', { email }).then((r) => r.data),
  forgotPassword: (email: string) =>
    client.post<OkResponse>('/auth/forgot-password', { email }).then((r) => r.data),
  resetPassword: (input: ResetPasswordInput) =>
    client.post<OkResponse>('/auth/reset-password', input).then((r) => r.data),
  changePassword: (input: ChangePasswordInput) =>
    client.patch<TokenPair>('/auth/password', input).then((r) => r.data),
  updateProfile: (input: UpdateProfileInput) =>
    client.patch<{ user: PublicUser }>('/profile', input).then((r) => r.data.user),
}
