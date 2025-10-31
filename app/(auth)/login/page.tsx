import Link from 'next/link'
import { LoginForm } from '@/components/LoginForm'

export default function LoginPage() {
  return (
    <section className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
      <h1 className="text-2xl font-semibold">Entrar</h1>
      <p className="text-sm text-slate-500 mt-2">Acesse sua conta para continuar.</p>
      <div className="mt-6">
        <LoginForm />
      </div>
      <div className="mt-4 text-sm text-slate-600">
        Não tem conta? <Link href="/register" className="text-primary-600 font-semibold">Cadastre-se</Link>
      </div>
    </section>
  )
}

