import { describe, it, expect } from 'vitest'
import { renderCalculoPdfBuffer } from '../lib/pdf'

const exemplo = {
  titulo: 'Teste PDF',
  valor_base: 100,
  data_inicio: '2024-01-01',
  data_citacao: '2024-01-02',
  data_final: '2024-03-01',
  tipo_calculo: 'teste',
  acumulado_inpc: 0.05,
  utilizou_fallback: false,
  juros_mensal: 0.01,
  inicio_juros: new Date().toISOString(),
  tabela_mensal: [
    { mes: '01/2024', vencimento: '01/01/2024', valor_original: 100, inpc_acumulado_pct: 0.5, valor_corrigido: 100.5, meses_juros: 2, juros_valor: 2.01, total: 102.51 },
    { mes: '02/2024', vencimento: '01/02/2024', valor_original: 100, inpc_acumulado_pct: 0.4, valor_corrigido: 100.4, meses_juros: 1, juros_valor: 1.004, total: 101.404 }
  ],
  valor_corrigido: 100.8,
  valor_juros: 2,
  resultado: 102.8,
}

describe('PDF generation', () => {
  it('renders a PDF buffer without throwing', async () => {
    const buf = await renderCalculoPdfBuffer(exemplo as any)
    expect(buf).toBeInstanceOf(Buffer)
    expect(buf.length).toBeGreaterThan(0)
  })
})
