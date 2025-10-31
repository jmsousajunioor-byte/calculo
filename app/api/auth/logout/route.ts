import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { clearSessionCookie } from '@/lib/session'

export async function POST() {
  await clearSessionCookie(cookies())
  return NextResponse.json({ ok: true })
}

