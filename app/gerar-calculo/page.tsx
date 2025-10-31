import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { GerarForm } from '@/components/GerarForm'

export default async function GerarCalculoPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')
  return (
    <section className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-800">Gerar cálculo judicial</h1>
        <p className="text-sm text-slate-500 mt-2">Preencha os dados para calcular automaticamente correção pelo INPC e juros legais. Se a API do IBGE estiver indisponível, informe o percentual manual no campo de fallback.</p>
      </div>
      <GerarForm />
    </section>
  )
}

