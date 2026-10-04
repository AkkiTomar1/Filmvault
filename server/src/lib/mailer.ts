import nodemailer, { type Transporter } from 'nodemailer'
import { env } from '../env.js'

/**
 * Verification and password-reset email.
 *
 * `EMAIL_MODE=console` prints the action link to stdout instead of sending, so
 * local development needs no SMTP credentials. Production refuses to boot
 * unless EMAIL_MODE=smtp (see env.ts), because a console-only deployment means
 * nobody can ever verify an account.
 *
 * Sends are deliberately fire-and-forget at the call site: a flaky SMTP server
 * must not turn a successful registration into a 500.
 */

let transporter: Transporter | null = null

function getTransporter(): Transporter | null {
  if (env.EMAIL_MODE === 'console') return null
  if (!transporter) {
    const port = env.SMTP_PORT ?? 587
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  }
  return transporter
}

function appUrl(path: string): string {
  return `${env.APP_URL.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function shell(title: string, body: string, ctaLabel: string, ctaHref: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#111827">
    <div style="max-width:520px;margin:0 auto;padding:32px 16px">
      <div style="background:#ffffff;border-radius:16px;padding:32px">
        <h1 style="margin:0 0 16px;font-size:20px">${title}</h1>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4b5563">${body}</p>
        <a href="${ctaHref}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:9999px">${ctaLabel}</a>
        <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6b7280;word-break:break-all">If the button does not work, paste this link into your browser:<br>${ctaHref}</p>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af">This link expires in 1 hour. If you did not request it, you can safely ignore this email.</p>
      </div>
      <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#9ca3af">Filmvault &middot; movie discovery</p>
    </div>
  </body>
</html>`
}

async function deliver(
  to: string,
  subject: string,
  text: string,
  html: string,
): Promise<void> {
  const tx = getTransporter()
  if (!tx) {
    console.info(`[filmvault-api] EMAIL_MODE=console — "${subject}" for ${to}\n${text}`)
    return
  }
  await tx.sendMail({ from: env.SMTP_FROM, to, subject, text, html })
}

const TOKEN_TTL_NOTE = 'This link expires in 1 hour.'

export async function sendVerificationEmail(to: string, token: string): Promise<void> {
  const link = appUrl(`verify-email?token=${encodeURIComponent(token)}`)
  try {
    await deliver(
      to,
      'Confirm your Filmvault email',
      [
        'Confirm your email address to finish setting up your Filmvault account.',
        '',
        link,
        '',
        TOKEN_TTL_NOTE,
      ].join('\n'),
      shell(
        'Confirm your email',
        'Confirm your email address to finish setting up your Filmvault account.',
        'Confirm email',
        link,
      ),
    )
  } catch (error) {
    console.error('[filmvault-api] verification email failed:', error)
  }
}

export async function sendPasswordResetEmail(to: string, token: string): Promise<void> {
  const link = appUrl(`reset-password?token=${encodeURIComponent(token)}`)
  try {
    await deliver(
      to,
      'Reset your Filmvault password',
      [
        'Someone requested a password reset for your Filmvault account.',
        '',
        link,
        '',
        `${TOKEN_TTL_NOTE} If you did not request this, ignore this email — your password stays unchanged.`,
      ].join('\n'),
      shell(
        'Reset your password',
        'Someone requested a password reset for your Filmvault account. If that was you, use the button below.',
        'Reset password',
        link,
      ),
    )
  } catch (error) {
    console.error('[filmvault-api] password reset email failed:', error)
  }
}