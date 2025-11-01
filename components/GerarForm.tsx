"use client"
import { useState } from 'react'

export function GerarForm() {
  const [form, setForm] = useState({
    titulo: '',
    valor_base: '',
    tipo_calculo: '',
    juros_mensal: '1.00',
    inicio_juros: '',
    data_fim_parcelas: '',
    data_inicio: '',
    data_citacao: '',
    data_final: '',
    inpc_override: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof typeof form>(k: K, v: string) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/calculos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        throw new Error(j?.error || 'Falha ao gerar cálculo')
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const safeTitle = form.titulo.trim().replace(/[^a-zA-Z0-9-_]+/g, '_') || 'calculo'
      link.download = `${safeTitle}_${Date.now()}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (err: any) {
      setError(err.message || 'Erro inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {error && <div className="md:col-span-2 text-sm text-red-600">{error}</div>}
      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-slate-600 mb-1">Título do cálculo</label>
        <input type="text" value={form.titulo} onChange={(e) => set('titulo', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Ex: Aluguel Junho/2023" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Valor base (R$)</label>
        <input required type="text" inputMode="decimal" value={form.valor_base} onChange={(e) => set('valor_base', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="0,00" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Tipo de cálculo</label>
        <input required type="text" value={form.tipo_calculo} onChange={(e) => set('tipo_calculo', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Ex: Aluguel com INPC + 1% a.m." />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Juros mensais (%)</label>
        <input type="number" step="0.01" min="0" value={form.juros_mensal} onChange={(e) => set('juros_mensal', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Ex: 1,00" />
        <p className="text-xs text-slate-400 mt-1">Percentual de juros aplicado mês a mês.</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Início dos juros (opcional)</label>
        <input type="date" value={form.inicio_juros} onChange={(e) => set('inicio_juros', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
        <p className="text-xs text-slate-400 mt-1">Se não informado: usa regra padrão (a partir da citação; caso posterior, a partir do dia seguinte ao vencimento).</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Data inicial</label>
        <input required type="date" value={form.data_inicio} onChange={(e) => set('data_inicio', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Data da citação</label>
        <input required type="date" value={form.data_citacao} onChange={(e) => set('data_citacao', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Data final</label>
        <input required type="date" value={form.data_final} onChange={(e) => set('data_final', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-600 mb-1">Data término das parcelas (opcional)</label>
        <input type="date" value={form.data_fim_parcelas} onChange={(e) => set('data_fim_parcelas', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" />
        <p className="text-xs text-slate-400 mt-1">Se informado, as parcelas (ex: aluguéis) serão consideradas devidas apenas até esta data; juros e INPC seguirão até a data final do cálculo.</p>
      </div>
      <div className="md:col-span-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 mb-1">Fallback INPC (%) <span className="text-xs font-normal text-slate-400">(opcional)</span></label>
        <input type="number" step="0.01" min="0" value={form.inpc_override} onChange={(e) => set('inpc_override', e.target.value)} className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm shadow-sm focus:border-primary-500 focus:ring-primary-500" placeholder="Informe percentual acumulado se necessário" />
        <p className="text-xs text-slate-400 mt-2">Este valor será usado apenas se a consulta automática ao INPC falhar. Informe o percentual acumulado desejado (ex: 5,32).</p>
      </div>
      <div className="md:col-span-2 flex justify-end">
        <button disabled={loading} className="inline-flex items-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-white font-semibold shadow-soft hover:shadow-lg transition disabled:opacity-50">
          {loading ? 'Gerando...' : 'Gerar cálculo e PDF'}
        </button>
      </div>
    </form>
  )
}
