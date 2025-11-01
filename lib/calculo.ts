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
  dataFimParcelas?: string // opcional: até quando as parcelas (ex: aluguéis) foram devidas
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

  // Tabela detalhada por mês (para exibição) e cálculo de totais por parcela
  const linhas: LinhaMensal[] = []
  const serieInpc = await obterSerieInpc(dataInicio, dataFinal)
  // data fim das parcelas (opcional). Se não informada, usa dataFinal - comportamento antigo
  const lastParcelMonth = params.dataFimParcelas ? parseLocalDate(params.dataFimParcelas) : dataFinal

  // Construir meses para exibição (do início até a data final da contagem)
  let cursor = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1)
  const endMonth = new Date(dataFinal.getFullYear(), dataFinal.getMonth(), 1)

  // Totais corretos: somar cada parcela (valorBase) corrigida individualmente até dataFinal
  let totalInpcSum = 0
  let totalJurosSum = 0

  // Lista de meses em que houve parcela devida (ex: aluguéis) — de dataInicio até lastParcelMonth
  const parcelasMonths: Date[] = []
  let p = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), 1)
  const lastParcelMonthKey = new Date(lastParcelMonth.getFullYear(), lastParcelMonth.getMonth(), 1)
  while (p.getFullYear() < lastParcelMonthKey.getFullYear() || (p.getFullYear() === lastParcelMonthKey.getFullYear() && p.getMonth() <= lastParcelMonthKey.getMonth())) {
    parcelasMonths.push(new Date(p))
    p = addMonths(p, 1)
  }

  // Para cada parcela, computar sua correção por INPC até dataFinal e juros compostos mensais se aplicável
  for (const parcelaMonth of parcelasMonths) {
    // INPC acumulado desde o mês da parcela até dataFinal
    let factor = 1
    let mm = new Date(parcelaMonth.getFullYear(), parcelaMonth.getMonth(), 1)
    while (mm.getFullYear() < endMonth.getFullYear() || (mm.getFullYear() === endMonth.getFullYear() && mm.getMonth() <= endMonth.getMonth())) {
      const code = mm.getFullYear().toString() + String(mm.getMonth() + 1).padStart(2, '0')
      const raw = Number(serieInpc[code] ?? 0)
      const pct = Number.isFinite(raw) ? raw : 0
      factor *= (1 + pct / 100)
      mm = addMonths(mm, 1)
    }
    const aposInpc = valorBase * factor

    // Juros: aplicar juros mensal composto a partir do mês em que endOfMonth(mm) >= inicioJuros
    let jurosMonths = 0
    let jm = new Date(parcelaMonth.getFullYear(), parcelaMonth.getMonth(), 1)
    while (jm.getFullYear() < endMonth.getFullYear() || (jm.getFullYear() === endMonth.getFullYear() && jm.getMonth() <= endMonth.getMonth())) {
      if (endOfMonth(jm) >= inicioJuros && jurosMensal > 0) jurosMonths++
      jm = addMonths(jm, 1)
    }
    const withJuros = aposInpc * Math.pow(1 + jurosMensal, jurosMonths)
    const jurosAmount = withJuros - aposInpc

    totalInpcSum += aposInpc
    totalJurosSum += jurosAmount
  }

  // Construir tabela de exibição mês a mês (valor_base é mostrado apenas enquanto houver parcela devida)
  while (cursor.getFullYear() < endMonth.getFullYear() || (cursor.getFullYear() === endMonth.getFullYear() && cursor.getMonth() <= endMonth.getMonth())) {
    const mesCodigo = cursor.getFullYear().toString() + String(cursor.getMonth() + 1).padStart(2, '0')
    const mesLabel = `${String(cursor.getMonth() + 1).padStart(2, '0')}/${cursor.getFullYear()}`
    const rawInpc = Number(serieInpc[mesCodigo] ?? 0)
    const inpcPct = Number.isFinite(rawInpc) ? rawInpc : 0

    // valor_base só é devido enquanto cursor <= lastParcelMonth
    const parcelaDevida = cursor.getFullYear() < lastParcelMonthKey.getFullYear() || (cursor.getFullYear() === lastParcelMonthKey.getFullYear() && cursor.getMonth() <= lastParcelMonthKey.getMonth())
    const valorAntes = parcelaDevida ? valorBase : 0

    const aplicaJuros = endOfMonth(cursor) >= inicioJuros
    const jurosPct = aplicaJuros ? (jurosMensal * 100) : 0

    // Para exibição simplificada, mostrar apos_inpc como valor acumulado do capital fictício (mantendo compatibilidade visual)
    // calculamos um valor aproximado sequencial similar ao comportamento anterior
    const prev = linhas.length > 0 ? linhas[linhas.length - 1].apos_inpc : valorBase
    const aposInpcDisplay = parcelaDevida ? prev * (1 + inpcPct / 100) : prev
    const aposJurosDisplay = aplicaJuros ? aposInpcDisplay * (1 + jurosMensal) : aposInpcDisplay

    linhas.push({ mes: mesLabel, valor_base: valorAntes, inpc_pct: inpcPct, apos_inpc: aposInpcDisplay, juros_pct: jurosPct, apos_juros: aposJurosDisplay })
    cursor = addMonths(cursor, 1)
  }

  // Totais finais
  const valorCorrigidoTotal = totalInpcSum
  const totalJuros = totalJurosSum
  const resultadoTotal = valorCorrigidoTotal + totalJuros

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
    valor_corrigido: Number(valorCorrigidoTotal),
    valor_juros: Number(totalJuros),
    resultado: Number(resultadoTotal),
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
