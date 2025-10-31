import { createClient } from '@supabase/supabase-js'

export function getSupabaseService() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error('Configuração do Supabase ausente (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function uploadPdfToStorage(fileName: string, buffer: Buffer) {
  const supabase = getSupabaseService()
  const bucket = process.env.SUPABASE_PDF_BUCKET || 'pdfs'
  // Ensure bucket exists (no-op if exists)
  await supabase.storage.createBucket(bucket, { public: true }).catch(() => {})
  const path = `${Date.now()}/${fileName}`
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: 'application/pdf',
    upsert: false
  })
  if (error) throw error
  const { data: pub } = supabase.storage.from(bucket).getPublicUrl(path)
  return { path, publicUrl: pub.publicUrl }
}

export type CalculoRow = {
  id: number
  user_id: number
  titulo: string | null
  valor_base: number | null
  data_inicio: string
  data_citacao: string
  data_final: string
  tipo_calculo: string | null
  resultado: number | null
  arquivo_pdf_path: string | null
  arquivo_pdf_url: string | null
  created_at: string
}

export async function getCalculosForUser(userId: number, limit?: number): Promise<CalculoRow[]> {
  const supabase = getSupabaseService()
  let query = supabase
    .from('calculos')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (limit) query = query.limit(limit)
  const { data, error } = await query
  if (error) throw error
  return data as CalculoRow[]
}

export async function countCalculosThisMonth(userId: number): Promise<number> {
  const supabase = getSupabaseService()
  const d = new Date()
  const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
  const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
  const { data, error } = await supabase
    .from('calculos')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
  if (error) throw error
  return (data as any)?.length ?? (error as any)?.count ?? 0
}

