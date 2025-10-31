"use client"
import { useState } from 'react'

export function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, password_confirmation: password2 })
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Falha no cadastro')
      }
      window.location.href = '/login'
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
        <label className="block text-sm font-medium mb-1">Nome</label>
        <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">E-mail</label>
        <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Senha</label>
        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Confirmar senha</label>
        <input type="password" required value={password2} onChange={e => setPassword2(e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div className="flex justify-end">
        <button disabled={loading} className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-white font-semibold shadow-soft hover:shadow-lg transition disabled:opacity-50">
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </div>
    </form>
  )
}

