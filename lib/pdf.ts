import type { CalculoResultado } from './calculo'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type PDFDocumentConstructor = typeof import('pdfkit')

let cachedFont: Buffer | null = null

function loadFontBuffer(): Buffer {
  if (cachedFont) return cachedFont
  const fontPath = process.env.CALCULO_PDF_FONT_PATH
    || path.join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-400-normal.woff')
  try {
    cachedFont = readFileSync(fontPath)
  } catch (error) {
    throw new Error(`Não foi possível carregar a fonte para o PDF em ${fontPath}. Ajuste CALCULO_PDF_FONT_PATH ou instale @fontsource/inter. Detalhes: ${(error as Error).message}`)
  }
  return cachedFont
}

function formatCurrency(v: number) {
  return v.toFixed(2).replace('.', ',')
}

export async function renderCalculoPdfBuffer(dados: CalculoResultado): Promise<Buffer> {
  const { default: PDFDocument } = (await import('pdfkit/js/pdfkit.standalone.js')) as unknown as {
    default: PDFDocumentConstructor
  }
  const doc = new PDFDocument({ size: 'A4', margin: 40 })
  const fontBuffer = loadFontBuffer()
  doc.registerFont('Inter', fontBuffer)
  doc.font('Inter')
  const chunks: Buffer[] = []
  doc.on('data', (c) => chunks.push(c as Buffer))
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

  doc.fontSize(18).fillColor('#0f172a').text(`${'Cálculo Judiciário'} · ${dados.titulo}`, { align: 'left' })
  doc.moveDown(0.5)
  doc.fontSize(10).fillColor('#64748b').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`)

  doc.moveDown(1)
  doc.fontSize(12).fillColor('#2563eb').text('Parâmetros')
  doc.moveDown(0.5)
  doc.fillColor('#0f172a').fontSize(10)
  doc.text(`Valor Base: R$ ${formatCurrency(dados.valor_base)}`)
  doc.text(`Tipo de Cálculo: ${dados.tipo_calculo}`)
  doc.text(`Período: ${new Date(dados.data_inicio).toLocaleDateString('pt-BR')} até ${new Date(dados.data_final).toLocaleDateString('pt-BR')}`)
  doc.text(`Data da Citação: ${new Date(dados.data_citacao).toLocaleDateString('pt-BR')}`)
  doc.text(`INPC Acumulado: ${(dados.acumulado_inpc * 100).toFixed(2)}% ${dados.utilizou_fallback ? '(Fallback)' : ''}`)

  doc.moveDown(1)
  doc.fillColor('#2563eb').fontSize(12).text('Detalhamento mensal')

  // Table header
  const headers = ['Mês', 'Valor base (R$)', 'INPC (%)', 'Após INPC (R$)', 'Juros (%)', 'Após Juros (R$)']
  const colX = [40, 120, 230, 300, 400, 470]
  const rowHeight = 18
  let y = doc.y + 6
  doc.fontSize(10).fillColor('#0f172a')
  headers.forEach((h, i) => doc.text(h, colX[i], y))
  y += rowHeight
  doc.moveTo(40, y - 6).lineTo(555, y - 6).strokeColor('#e2e8f0').stroke()

  for (const linha of dados.tabela_mensal) {
    if (y > 760) { doc.addPage(); y = 40 }
    doc.text(linha.mes, colX[0], y)
    doc.text(`R$ ${formatCurrency(linha.valor_base)}`, colX[1], y)
    doc.text((linha.inpc_pct).toFixed(2) + '%', colX[2], y)
    doc.text(`R$ ${formatCurrency(linha.apos_inpc)}`, colX[3], y)
    doc.text((linha.juros_pct).toFixed(2) + '%', colX[4], y)
    doc.text(`R$ ${formatCurrency(linha.apos_juros)}`, colX[5], y)
    y += rowHeight
  }

  doc.addPage()
  doc.fillColor('#2563eb').fontSize(12).text('Totais')
  doc.moveDown(0.5)
  doc.fillColor('#0f172a').fontSize(12)
  doc.text(`Valor total com juros: R$ ${formatCurrency(dados.valor_juros)}`)
  doc.text(`Valor total com INPC: R$ ${formatCurrency(dados.valor_corrigido)}`)
  doc.text(`Valor total geral: R$ ${formatCurrency(dados.resultado)}`)

  doc.end()
  return done
}
