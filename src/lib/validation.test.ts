import { validateEmail, validateLogin, validatePassword, validateSignup } from './validation'

describe('validation', () => {
  it('validates email', () => {
    expect(validateEmail('')).toBe('Email is required.')
    expect(validateEmail('bad')).toBe('Enter a valid email address.')
    expect(validateEmail('ok@example.com')).toBeUndefined()
  })
  it('validates password length', () => {
    expect(validatePassword('short')).toBe('Password must be at least 10 characters.')
    expect(validatePassword('1234567890')).toBeUndefined()
  })
  it('validateLogin returns errors', () => {
    const e = validateLogin({ email: '', password: '' })
    expect(e.email).toBeDefined()
    expect(e.password).toBeDefined()
  })
  it('validateSignup basic', () => {
    expect(validateSignup({ email: 'x@y.z', password: '1234567890' })).toEqual({})
  })
})
