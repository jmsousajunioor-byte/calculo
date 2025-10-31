import { getSupabaseService, type CalculoRow } from './supabase'

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
  const { count, error } = await supabase
    .from('calculos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', start)
    .lte('created_at', end)
  if (error) throw error
  return count ?? 0
}

