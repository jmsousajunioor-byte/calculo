import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/session'
import { processCalculo } from '@/lib/calculo'

const schema = z.object({
  titulo: z.string().optional().default(''),
  valor_base: z.string().min(1),
  tipo_calculo: z.string().min(1),
  juros_mensal: z.string().optional(),
  inicio_juros: z.string().optional(),
  data_fim_parcelas: z.string().optional(),
  data_inicio: z.string().min(1),
  data_citacao: z.string().min(1),
  data_final: z.string().min(1),
  inpc_override: z.string().optional(),
})

export async function POST(req: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  try {
    const body = await req.json()
    const parsed = schema.parse(body)
    const valorBase = parseFloat(parsed.valor_base.replace(/\./g, '').replace(',', '.'))
    if (!Number.isFinite(valorBase) || valorBase <= 0) {
      return NextResponse.json({ error: 'Valor base inválido' }, { status: 400 })
    }
    const jurosMensalPct = parsed.juros_mensal ? parseFloat(parsed.juros_mensal) : undefined
    const inpcOverridePct = parsed.inpc_override ? parseFloat(parsed.inpc_override) : undefined

    const resultado = await processCalculo({
      valorBase,
      titulo: parsed.titulo || `Cálculo #${new Date().toISOString().replace(/[-:TZ.]/g, '').slice(0, 14)}`,
      dataInicio: parsed.data_inicio,
      dataCitacao: parsed.data_citacao,
      dataFinal: parsed.data_final,
      tipoCalculo: parsed.tipo_calculo,
      dataFimParcelas: parsed.data_fim_parcelas && parsed.data_fim_parcelas.trim() ? parsed.data_fim_parcelas : undefined,
      inpcOverride: Number.isFinite(inpcOverridePct) ? (inpcOverridePct as number) : undefined,
      jurosMensalPct: Number.isFinite(jurosMensalPct) ? (jurosMensalPct as number) : undefined,
      inicioJuros: parsed.inicio_juros && parsed.inicio_juros.trim() ? parsed.inicio_juros : undefined,
    })

    // Gera PDF em memória e devolve para download imediato
    const pdfBuffer = await import('@/lib/pdf').then(m => m.renderCalculoPdfBuffer(resultado))
    const fileName = `${resultado.titulo.replace(/[^a-zA-Z0-9-_]+/g, '_') || 'calculo'}_${Date.now()}.pdf`
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Erro' }, { status: 400 })
  }
}
