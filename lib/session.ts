import { cookies as nextCookies } from 'next/headers'

const COOKIE_NAME = 'calculo3_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7 // 7 days
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-secret-change-me'

type SessionData = { user?: { id: number; name: string; email: string } }

function sign(value: string): string {
  const crypto = require('node:crypto')
  const h = crypto.createHmac('sha256', SESSION_SECRET)
  h.update(value)
  return `${value}.${h.digest('hex')}`
}

function unsign(signed: string): string | null {
  const idx = signed.lastIndexOf('.')
  if (idx === -1) return null
  const raw = signed.slice(0, idx)
  return sign(raw) === signed ? raw : null
}

export async function getSession(): Promise<SessionData | null> {
  const cookie = (await nextCookies()).get(COOKIE_NAME)
  if (!cookie?.value) return null
  try {
    const raw = unsign(cookie.value)
    if (!raw) return null
    return JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

export async function setSessionCookie(cookies: any, data: SessionData) {
  const raw = Buffer.from(JSON.stringify(data), 'utf8').toString('base64url')
  const v = sign(raw)
  cookies.set(COOKIE_NAME, v, { path: '/', httpOnly: true, sameSite: 'lax', maxAge: COOKIE_MAX_AGE, secure: process.env.NODE_ENV === 'production' })
}

export async function clearSessionCookie(cookies: any) {
  cookies.set(COOKIE_NAME, '', { path: '/', httpOnly: true, maxAge: 0 })
}
