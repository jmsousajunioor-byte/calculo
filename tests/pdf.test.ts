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
    { mes: '01/2024', valor_base: 100, inpc_pct: 0.5, apos_inpc: 100.5, juros_pct: 1, apos_juros: 101.505 },
    { mes: '02/2024', valor_base: 100, inpc_pct: 0.4, apos_inpc: 100.4, juros_pct: 1, apos_juros: 101.404 }
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
