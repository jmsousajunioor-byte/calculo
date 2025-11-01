import { addMonths, endOfMonth, addDays } from 'date-fns'
import { buscarInpcAcumulado, listarPeriodosMensais, obterSerieInpc } from './inpc'

export type LinhaMensal = {
  mes: string
  vencimento: string // ex: 05/05/24
  valor_original: number
  inpc_acumulado_pct: number
  valor_corrigido: number
  meses_juros: number
  juros_valor: number
  total: number
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

  // Tabela detalhada por parcela (cada parcela representa uma obrigação mensal)
  const linhas: LinhaMensal[] = []
  const serieInpc = await obterSerieInpc(dataInicio, dataFinal)
  // data fim das parcelas (opcional). Se não informada, usa dataFinal como último mês de parcelas
  const lastParcelDate = params.dataFimParcelas ? parseLocalDate(params.dataFimParcelas) : dataFinal

  const parcelas: { mesDate: Date; vencimentoDay: number; vencimentoStr: string; valorOriginal: number }[] = []
  // montar meses de parcelas desde dataInicio até lastParcelDate (incluindo mês parcial)
  // Preserve o dia do vencimento informado em dataInicio (ex: 05 de cada mês).
  let pm = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate())
  const lastParcelMonthKey = new Date(lastParcelDate.getFullYear(), lastParcelDate.getMonth(), 1)
  while (pm.getFullYear() < lastParcelMonthKey.getFullYear() || (pm.getFullYear() === lastParcelMonthKey.getFullYear() && pm.getMonth() <= lastParcelMonthKey.getMonth())) {
    parcelas.push({ mesDate: new Date(pm.getFullYear(), pm.getMonth(), pm.getDate()), vencimentoDay: pm.getDate(), vencimentoStr: `${String(pm.getDate()).padStart(2,'0')}/${String(pm.getMonth()+1).padStart(2,'0')}/${pm.getFullYear()}`, valorOriginal: valorBase })
    pm = addMonths(pm, 1)
  }
  // if last parcel is partial (dataFimParcelas day not last day of month), prorate last parcela
  if (params.dataFimParcelas) {
    const lp = parseLocalDate(params.dataFimParcelas)
    const lastIdx = parcelas.length - 1
    if (lastIdx >= 0) {
      const monthStart = new Date(parcelas[lastIdx].mesDate.getFullYear(), parcelas[lastIdx].mesDate.getMonth(), 1)
      const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate()
      const daysDue = Math.min(Math.max(lp.getDate(), 0), daysInMonth)
      if (daysDue < daysInMonth) {
        parcelas[lastIdx].valorOriginal = Math.round((valorBase * (daysDue / daysInMonth)) * 100) / 100
      }
      // keep vencimento day as original configured day
      const vd = parcelas[lastIdx].vencimentoDay
      parcelas[lastIdx].vencimentoStr = `${String(vd).padStart(2,'0')}/${String(monthStart.getMonth()+1).padStart(2,'0')}/${monthStart.getFullYear()}`
    }
  }

  const endMonth = new Date(dataFinal.getFullYear(), dataFinal.getMonth(), 1)
  let totalInpcSum = 0
  let totalJurosSum = 0

  for (const pItem of parcelas) {
    const parcelaMonth = pItem.mesDate
    // INPC acumulado desde o mês da parcela até dataFinal (produto dos fatores mensais)
    let factor = 1
    let mm = new Date(parcelaMonth.getFullYear(), parcelaMonth.getMonth(), 1)
    while (mm.getFullYear() < endMonth.getFullYear() || (mm.getFullYear() === endMonth.getFullYear() && mm.getMonth() <= endMonth.getMonth())) {
      const code = mm.getFullYear().toString() + String(mm.getMonth() + 1).padStart(2, '0')
      const raw = Number(serieInpc[code] ?? 0)
      const pct = Number.isFinite(raw) ? raw : 0
      factor *= (1 + pct / 100)
      mm = addMonths(mm, 1)
    }
    const inpcAcumuladoPct = (factor - 1) * 100
    const valorCorrigido = Math.round(pItem.valorOriginal * factor * 100) / 100

    // Juros simples: regra aplicada conforme interpretação jurídica:
    // - Se a parcela já estava vencida na data da citação (vencimento <= inicioJuros),
    //   os juros começam a contar a partir da citação (inicioJuros).
    // - Se a parcela vence após a citação, os juros começam a contar no dia seguinte ao vencimento.
    const vencimentoDate = new Date(parcelaMonth.getFullYear(), parcelaMonth.getMonth(), pItem.vencimentoDay)
    let jurosStartDate: Date
    if (vencimentoDate <= inicioJuros) {
      jurosStartDate = inicioJuros
    } else {
      jurosStartDate = addDays(vencimentoDate, 1)
    }
    // Calcular meses inteiros de juros entre jurosStartDate e dataFinal.
    let mesesJuros = (dataFinal.getFullYear() - jurosStartDate.getFullYear()) * 12 + (dataFinal.getMonth() - jurosStartDate.getMonth())
    // Ajuste por dia do mês: se o dia final é antes do dia inicial, subtrai 1
    if (dataFinal.getDate() < jurosStartDate.getDate()) mesesJuros -= 1
    mesesJuros = Math.max(0, mesesJuros)
    const jurosValor = Math.round((valorCorrigido * (jurosMensal * mesesJuros)) * 100) / 100

    const totalParcela = Math.round((valorCorrigido + jurosValor) * 100) / 100

    totalInpcSum += valorCorrigido
    totalJurosSum += jurosValor

    linhas.push({
      mes: `${String(parcelaMonth.getMonth()+1).padStart(2,'0')}/${parcelaMonth.getFullYear()}`,
      vencimento: `${String(parcelaMonth.getDate()).padStart(2,'0')}/${String(parcelaMonth.getMonth()+1).padStart(2,'0')}/${parcelaMonth.getFullYear()}`,
      valor_original: pItem.valorOriginal,
      inpc_acumulado_pct: Math.round(inpcAcumuladoPct * 100) / 100,
      valor_corrigido: valorCorrigido,
      meses_juros: mesesJuros,
      juros_valor: jurosValor,
      total: totalParcela,
    })
  }

  const valorCorrigidoTotal = Math.round(totalInpcSum * 100) / 100
  const totalJuros = Math.round(totalJurosSum * 100) / 100
  const resultadoTotal = Math.round((valorCorrigidoTotal + totalJuros) * 100) / 100

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
