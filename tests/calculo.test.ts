import { describe, it, expect, vi } from 'vitest'
import { processCalculo } from '@/lib/calculo'
import * as inpc from '@/lib/inpc'

describe('processCalculo', () => {
  it('calcula com INPC e juros default', async () => {
    vi.spyOn(inpc, 'obterSerieInpc').mockResolvedValue({
      '202401': 1.0,
      '202402': 0.5,
      '202403': 0.0,
    })
    vi.spyOn(inpc, 'buscarInpcAcumulado').mockResolvedValue(0.015) // 1.5%

    const r = await processCalculo({
      titulo: 'Teste',
      valorBase: 1000,
      dataInicio: '2024-01-01',
      dataCitacao: '2024-01-10',
      dataFinal: '2024-03-10',
      tipoCalculo: 'INPC + 1% a.m.'
    })

    expect(r.valor_base).toBe(1000)
    expect(r.tabela_mensal.length).toBe(3)
    expect(r.acumulado_inpc).toBeCloseTo(0.015, 5)
    // valores aproximados (depende da ordem aplicada)
    expect(r.resultado).toBeGreaterThan(1015)
  })
})

