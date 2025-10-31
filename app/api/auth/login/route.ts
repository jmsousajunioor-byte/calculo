import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase'
import { setSessionCookie } from '@/lib/session'
import bcrypt from 'node:crypto'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password } = schema.parse(body)
    const supabase = getSupabaseService()
    const { data, error } = await supabase.from('users').select('*').eq('email', email).limit(1).maybeSingle()
    if (error) throw error
    if (!data) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })

    // bcrypt via crypto.scryptSync fallback for demo (since bcrypt isn't ideal on Vercel w/out native deps)
    // Passwords were hashed using node crypto in register route.
    const [algo, salt, hash] = (data.password as string).split('$')
    if (algo !== 'scrypt') return NextResponse.json({ error: 'Hash inválido' }, { status: 500 })
    const derived = (await import('node:crypto')).scryptSync(password, salt, 64).toString('hex')
    if (derived !== hash) return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })

    await setSessionCookie(cookies(), { user: { id: data.id, name: data.name, email: data.email } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 400 })
  }
}

