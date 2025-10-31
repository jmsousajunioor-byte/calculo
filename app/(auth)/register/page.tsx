import Link from 'next/link'
import { RegisterForm } from '@/components/RegisterForm'

export default function RegisterPage() {
  return (
    <section className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
      <h1 className="text-2xl font-semibold">Cadastrar</h1>
      <p className="text-sm text-slate-500 mt-2">Crie sua conta.</p>
      <div className="mt-6">
        <RegisterForm />
      </div>
      <div className="mt-4 text-sm text-slate-600">
        Já tem conta? <Link href="/login" className="text-primary-600 font-semibold">Entrar</Link>
      </div>
    </section>
  )
}

