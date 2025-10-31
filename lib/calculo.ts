import { addMonths, endOfMonth } from 'date-fns'
import { buscarInpcAcumulado, listarPeriodosMensais, obterSerieInpc } from './inpc'

export type LinhaMensal = {
  mes: string
  valor_base: number
  inpc_pct: number
  apos_inpc: number
  juros_pct: number
  apos_juros: number
}

export type CalculoResultado = {
  titulo: string
  valor_base: number
  data_inicio: string
  data_citacao: string
  data_final: string
  tipo_calculo: string
  acumulado_inpc: number
  utilizou_fallback: boolean
  juros_mensal: number
  inicio_juros: string
  tabela_mensal: LinhaMensal[]
  valor_corrigido: number
  valor_juros: number
  resultado: number
}

export const JUROS_MENSAL_PADRAO = 0.01

export async function processCalculo(params: {
  titulo: string
  valorBase: number
  dataInicio: string
  dataCitacao: string
  dataFinal: string
  tipoCalculo: string
  inpcOverride?: number // em %
  jurosMensalPct?: number // em %
  inicioJuros?: string
}): Promise<CalculoResultado> {
  const titulo = params.titulo
  const valorBase = params.valorBase
  const dataInicio = parseLocalDate(params.dataInicio)
  const dataCitacao = parseLocalDate(params.dataCitacao)
  const dataFinal = parseLocalDate(params.dataFinal)
  if (!(valorBase > 0) || !(dataInicio <= dataFinal)) throw new Error('Dados inválidos')

  let acumuladoInpc = await buscarInpcAcumulado(dataInicio, dataFinal)
  let utilizouFallback = false
  if (acumuladoInpc == null) {
    if (typeof params.inpcOverride === 'number' && isFinite(params.inpcOverride)) {
      acumuladoInpc = params.inpcOverride / 100
      utilizouFallback = true
    } else {
      acumuladoInpc = 0
      utilizouFallback = true
    }
  }

  // Default início dos juros
  let inicioJuros = dataInicio < dataCitacao ? dataCitacao : new Date(dataInicio.getTime() + 24 * 60 * 60 * 1000)
  if (params.inicioJuros) {
    const d = parseLocalDate(params.inicioJuros)
    if (!isNaN(+d)) inicioJuros = d
  }
  if (inicioJuros > dataFinal) inicioJuros = dataFinal

  const jurosMensal = typeof params.jurosMensalPct === 'number' && isFinite(params.jurosMensalPct)
    ? params.jurosMensalPct / 100
    : JUROS_MENSAL_PADRAO

  // Tabela detalhada
  const linhas: LinhaMensal[] = []
  const serieInpc = await obterSerieInpc(dataInicio, dataFinal)
  let cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1)
  let valorAposInpc = valorBase
  let valorFinal = valorBase
  let totalJuros = 0

  const endMonth = new Date(dataFinal.getFullYear(), dataFinal.getMonth(), 1)
  while (cursor.getFullYear() < endMonth.getFullYear() || (cursor.getFullYear() === endMonth.getFullYear() && cursor.getMonth() <= endMonth.getMonth())) {
    const mesCodigo = cursor.getFullYear().toString() + String(cursor.getMonth() + 1).padStart(2, '0')
    const mesLabel = `${String(cursor.getMonth() + 1).padStart(2, '0')}/${cursor.getFullYear()}`
    const rawInpc = Number(serieInpc[mesCodigo] ?? 0)
    const inpcPct = Number.isFinite(rawInpc) ? rawInpc : 0
    const valorAntes = valorBase
    valorAposInpc = valorAposInpc * (1 + (inpcPct / 100))
    const aplicaJuros = endOfMonth(cursor) >= inicioJuros
    const jurosPct = aplicaJuros ? (jurosMensal * 100) : 0
    let valorAposJuros = valorAposInpc
    if (aplicaJuros && jurosMensal > 0) {
      const inc = valorAposInpc * jurosMensal
      totalJuros += inc
      valorAposJuros += inc
    }
    linhas.push({ mes: mesLabel, valor_base: valorAntes, inpc_pct: inpcPct, apos_inpc: valorAposInpc, juros_pct: jurosPct, apos_juros: valorAposJuros })
    valorFinal = valorAposJuros
    cursor = addMonths(cursor, 1)
  }

  return {
    titulo,
    valor_base: valorBase,
    data_inicio: params.dataInicio,
    data_citacao: params.dataCitacao,
    data_final: params.dataFinal,
    tipo_calculo: params.tipoCalculo,
    acumulado_inpc: acumuladoInpc,
    utilizou_fallback: utilizouFallback,
    juros_mensal: jurosMensal,
    inicio_juros: inicioJuros.toISOString(),
    tabela_mensal: linhas,
    valor_corrigido: valorAposInpc,
    valor_juros: totalJuros,
    resultado: valorFinal,
  }
}

function parseLocalDate(s: string): Date {
  // Accept both YYYY-MM-DD and ISO strings; prefer local-constructed date to avoid TZ shift
  const m = /^([0-9]{4})-([0-9]{2})-([0-9]{2})/.exec(s)
  if (m) {
    const y = Number(m[1])
    const mo = Number(m[2]) - 1
    const d = Number(m[3])
    return new Date(y, mo, d)
  }
  const d = new Date(s)
  return d
}
