import {
  EMAIL_MAX,
  PASSWORD_MAX,
  PASSWORD_MIN,
  type LoginInput,
  type SignupInput,
} from '../types/auth'

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateEmail(value: string): string | undefined {
  const v = value.trim()
  if (!v) return 'Email is required.'
  if (v.length > EMAIL_MAX) return `Email must be at most ${EMAIL_MAX} characters.`
  if (!EMAIL_RE.test(v)) return 'Enter a valid email address.'
  return undefined
}

export function validatePassword(value: string): string | undefined {
  if (!value) return 'Password is required.'
  if (value.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters.`
  if (value.length > PASSWORD_MAX) return `Password must be at most ${PASSWORD_MAX} characters.`
  return undefined
}

export function validateLogin(values: LoginInput): Partial<Record<keyof LoginInput, string>> {
  const errors: Partial<Record<keyof LoginInput, string>> = {}
  const emailErr = validateEmail(values.email)
  if (emailErr) errors.email = emailErr
  const passErr = validatePassword(values.password)
  if (passErr) errors.password = passErr
  return errors
}

export function validateSignup(values: SignupInput): Partial<Record<keyof SignupInput, string>> {
  const errors: Partial<Record<keyof SignupInput, string>> = {}
  const emailErr = validateEmail(values.email)
  if (emailErr) errors.email = emailErr
  const passErr = validatePassword(values.password)
  if (passErr) errors.password = passErr
  return errors
}
