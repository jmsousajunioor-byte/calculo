import { addMonths, endOfMonth, isAfter, isBefore } from 'date-fns'

export type SerieMensal = Record<string, number> // YYYYMM -> percentual mensal (ex: 0.42)

export function listarPeriodosMensais(inicio: Date, fim: Date): string[] {
  const arr: string[] = []
  let cur = new Date(inicio.getUTCFullYear(), inicio.getUTCMonth(), 1)
  const endMonth = new Date(fim.getUTCFullYear(), fim.getUTCMonth(), 1)
  while (cur.getUTCFullYear() < endMonth.getUTCFullYear() || (cur.getUTCFullYear() === endMonth.getUTCFullYear() && cur.getUTCMonth() <= endMonth.getUTCMonth())) {
    const code = cur.getUTCFullYear().toString() + String(cur.getUTCMonth() + 1).padStart(2, '0')
    arr.push(code)
    cur = addMonths(cur, 1)
  }
  return arr
}

async function httpGetJson(url: string, timeoutMs = 12000): Promise<any | null> {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: controller.signal as any })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  } finally {
    clearTimeout(t)
  }
}

export async function obterSerieInpc(inicio: Date, fim: Date): Promise<SerieMensal> {
  const pInicio = inicio.getFullYear().toString() + String(inicio.getMonth() + 1).padStart(2, '0')
  const pFim = fim.getFullYear().toString() + String(fim.getMonth() + 1).padStart(2, '0')
  // API agregados
  let serie: SerieMensal | null = null
  const urlAg = `https://servicodados.ibge.gov.br/api/v3/agregados/1736/periodos/${pInicio}-${pFim}/variaveis/44?localidades=${encodeURIComponent('N1[all]')}`
  const json = await httpGetJson(urlAg)
  if (Array.isArray(json)) {
    const maybe = json?.[0]?.resultados?.[0]?.series?.[0]?.serie
    if (maybe && typeof maybe === 'object') {
      const map: SerieMensal = {}
      for (const [key, val] of Object.entries(maybe)) {
        if (val == null) continue
        const n = Number(String(val).replace(',', '.'))
        if (!Number.isNaN(n)) map[key] = n
      }
      serie = map
    }
  }
  if (!serie) {
    // fallback SIDRA values
    const urlSidra = `https://apisidra.ibge.gov.br/values/t/1736/n1/all/v/44/p/${pInicio}-${pFim}?formato=json`
    const sidra = await httpGetJson(urlSidra)
    const map: SerieMensal = {}
    if (Array.isArray(sidra)) {
      for (const row of sidra) {
        if (row && typeof row === 'object') {
          const cod = row['D3C'] ?? row['Mês (Código)']
          const val = row['V'] ?? row['Valor']
          if (cod && val != null) {
            map[String(cod)] = parseFloat(String(val).replace(',', '.'))
          }
        }
      }
    }
    serie = map
  }
  return serie || {}
}

export async function buscarInpcAcumulado(inicio: Date, fim: Date): Promise<number | null> {
  const serie = await obterSerieInpc(inicio, fim)
  const periodos = listarPeriodosMensais(inicio, fim)
  let fator = 1
  for (const p of periodos) {
    if (serie[p] == null) continue
    fator *= (1 + (Number(serie[p]) / 100))
  }
  return fator - 1
}
