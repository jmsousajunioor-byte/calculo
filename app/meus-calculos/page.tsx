import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { getCalculosForUser } from '@/lib/data'

export default async function MeusCalculosPage() {
  const session = await getSession()
  if (!session?.user) redirect('/login')
  const userId = session.user.id
  const calculos = await getCalculosForUser(userId)

  return (
    <section className="bg-white/80 backdrop-blur border border-slate-200 rounded-3xl shadow-soft p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Histórico de cálculos</h1>
          <p className="text-sm text-slate-500 mt-2">Consulte os cálculos já realizados, baixe os PDFs e acompanhe os resultados.</p>
        </div>
        <Link href="/gerar-calculo" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-5 py-2.5 text-white font-semibold shadow-soft hover:shadow-lg transition">Novo cálculo</Link>
      </div>

      {calculos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-primary-200 bg-primary-50/60 p-10 text-center">
          <p className="text-sm font-medium text-primary-600">Você ainda não gerou cálculos.</p>
          <p className="text-xs text-primary-500 mt-2">Comece criando um novo cálculo para visualizar seu histórico aqui.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left">Título</th>
                <th className="px-4 py-3 text-left">Período</th>
                <th className="px-4 py-3 text-left">Resultado</th>
                <th className="px-4 py-3 text-left">Criado em</th>
                <th className="px-4 py-3 text-left">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {calculos.map((c) => (
                <tr key={c.id} className="hover:bg-primary-50/40 transition">
                  <td className="px-4 py-3 font-medium text-slate-700">{c.titulo || 'Sem título'}</td>
                  <td className="px-4 py-3 text-slate-500">{new Date(c.data_inicio).toLocaleDateString('pt-BR')} – {new Date(c.data_final).toLocaleDateString('pt-BR')}</td>
                  <td className="px-4 py-3 text-primary-600 font-semibold">R$ {(c.resultado ?? 0).toFixed(2).replace('.', ',')}</td>
                  <td className="px-4 py-3 text-slate-400">{new Date(c.created_at).toLocaleString('pt-BR')}</td>
                  <td className="px-4 py-3">
                    {c.arquivo_pdf_url ? (
                      <a className="inline-flex items-center gap-1 rounded-full border border-primary-300 bg-primary-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary-600 hover:bg-primary-100 transition" href={`/api/calculos/${c.id}/download`}>
                        Baixar
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">Sem arquivo</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

