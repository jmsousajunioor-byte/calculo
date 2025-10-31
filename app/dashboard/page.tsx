import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getCalculosForUser, countCalculosThisMonth } from '@/lib/data'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')
  const userId = session.user.id
  const totalMes = await countCalculosThisMonth(userId)
  const calculos = await getCalculosForUser(userId, 5)

  return (
    <section className="grid gap-6">
      <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary-600 font-semibold mb-2">Bem-vindo(a), {session.user.name}</p>
            <h1 className="text-3xl font-semibold text-slate-800">Resumo de produção</h1>
            <p className="text-sm text-slate-500 mt-2">Visualize rapidamente sua performance de cálculos judiciais neste mês.</p>
          </div>
          <div className="rounded-2xl border border-primary-200 bg-primary-50 px-6 py-4 text-center">
            <span className="block text-xs uppercase tracking-widest text-primary-600 font-semibold">Cálculos no mês</span>
            <span className="text-4xl font-bold text-primary-700 mt-2">{totalMes}</span>
          </div>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-800">Últimos cálculos gerados</h2>
          <Link href="/meus-calculos" className="text-sm text-primary-600 hover:text-primary-700 font-semibold">Ver todos</Link>
        </div>
        {calculos.length === 0 ? (
          <div className="text-sm text-slate-500">Ainda não há cálculos registrados. Gere seu primeiro cálculo para começar!</div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">Título</th>
                  <th className="px-4 py-3 text-left">Tipo</th>
                  <th className="px-4 py-3 text-left">Resultado</th>
                  <th className="px-4 py-3 text-left">Criado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {calculos.map((c) => (
                  <tr key={c.id} className="hover:bg-primary-50/40 transition">
                    <td className="px-4 py-3 font-medium text-slate-700">{c.titulo || 'Sem título'}</td>
                    <td className="px-4 py-3 text-slate-500">{c.tipo_calculo}</td>
                    <td className="px-4 py-3 text-primary-600 font-semibold">R$ {(c.resultado ?? 0).toFixed(2).replace('.', ',')}</td>
                    <td className="px-4 py-3 text-slate-400">{new Date(c.created_at).toLocaleString('pt-BR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

