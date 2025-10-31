import { NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase'
import { getSession } from '@/lib/session'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  const supabase = getSupabaseService()
  const { data, error } = await supabase.from('calculos').select('id,user_id,arquivo_pdf_path,arquivo_pdf_url').eq('id', Number(params.id)).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data || data.user_id !== session.user.id) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

  if (data.arquivo_pdf_url) {
    return NextResponse.redirect(data.arquivo_pdf_url, { status: 302 })
  }

  return NextResponse.json({ error: 'Arquivo não disponível' }, { status: 404 })
}

