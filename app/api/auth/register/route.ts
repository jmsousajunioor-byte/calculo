import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSupabaseService } from '@/lib/supabase'

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
  password_confirmation: z.string().min(6)
}).refine((d) => d.password === d.password_confirmation, { message: 'As senhas não coincidem', path: ['password_confirmation'] })

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, email, password } = schema.parse(body)
    const supabase = getSupabaseService()

    // If exists
    const existing = await supabase.from('users').select('id').eq('email', email).limit(1).maybeSingle()
    if (existing.data) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }

    // Hash password using scrypt (portable, no native deps)
    const crypto = await import('node:crypto')
    const salt = crypto.randomBytes(16).toString('hex')
    const hash = crypto.scryptSync(password, salt, 64).toString('hex')
    const passwordHash = `scrypt$${salt}$${hash}`

    const { error } = await supabase.from('users').insert({ name, email, password: passwordHash })
    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 400 })
  }
}

