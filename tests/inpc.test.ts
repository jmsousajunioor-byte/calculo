import { describe, it, expect } from 'vitest'
import { listarPeriodosMensais } from '@/lib/inpc'

describe('listarPeriodosMensais', () => {
  it('gera sequência mensal inclusive', () => {
    const ini = new Date('2024-01-15')
    const fim = new Date('2024-04-01')
    const p = listarPeriodosMensais(ini, fim)
    expect(p).toEqual(['202401', '202402', '202403', '202404'])
  })
})

