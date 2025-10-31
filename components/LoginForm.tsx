"use client"
import { useState } from 'react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Falha no login')
      }
      window.location.href = '/dashboard'
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 max-w-md">
      {error && <div className="text-sm text-red-600">{error}</div>}
      <div>
        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Senha</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div className="flex justify-end">
        <button disabled={loading} className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-white font-semibold shadow-soft hover:shadow-lg transition disabled:opacity-50">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>
    </form>
  )
}

