import type { CalculoResultado } from './calculo'
import { readFileSync } from 'node:fs'
import path from 'node:path'

type PDFDocumentConstructor = typeof import('pdfkit')

// cachedFont holds the raw font buffer when available. If not available we
// gracefully fall back to a standard PDF font so the PDF generation still
// works in environments where @fontsource/inter isn't installed (AWS
// Lambda, Vercel serverless, etc.).
let cachedFont: Buffer | null | undefined = undefined

function loadFontBuffer(): Buffer | null {
  if (cachedFont !== undefined) return cachedFont
  const fontPath = process.env.CALCULO_PDF_FONT_PATH
    || path.join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files', 'inter-latin-400-normal.woff')
  try {
    cachedFont = readFileSync(fontPath)
  } catch (error) {
    // Instead of throwing, record absence and return null so caller can
    // choose a safe fallback font. This avoids surfacing the file-system
    // error to end-users when running in restricted environments.
    cachedFont = null
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
  if (fontBuffer) {
    try {
      doc.registerFont('Inter', fontBuffer)
      doc.font('Inter')
    } catch (err) {
      // If registration fails for any reason, fall back to a standard font.
      doc.font('Helvetica')
    }
  } else {
    // Use a standard built-in PDF font when the custom font isn't available.
    doc.font('Helvetica')
  }
  const chunks: Buffer[] = []
  doc.on('data', (c) => chunks.push(c as Buffer))
  const done = new Promise<Buffer>((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)))
  })

    doc.fontSize(18).fillColor('#0f172a').text(`${'Cálculo Judiciário'} · ${dados.titulo}`, { align: 'left' })
    doc.moveDown(0.5)
    doc.fontSize(10).fillColor('#64748b').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`)

  // Parâmetros em cartão estilizado
  doc.moveDown(1)
  const cardX = 40
  const cardW = 515
  const cardY = doc.y
  const cardH = 70
  doc.rect(cardX, cardY, cardW, cardH).fill('#f8fafc')
  doc.fillColor('#0f172a').fontSize(12).text('Parâmetros', cardX + 10, cardY + 8)
  doc.fillColor('#0f172a').fontSize(10)
  const leftColX = cardX + 10
  const rightColX = cardX + 260
  doc.text(`Valor Base: R$ ${formatCurrency(dados.valor_base)}`, leftColX, cardY + 28)
  doc.text(`Tipo de Cálculo: ${dados.tipo_calculo}`, rightColX, cardY + 28)
  doc.text(`Período: ${new Date(dados.data_inicio).toLocaleDateString('pt-BR')} até ${new Date(dados.data_final).toLocaleDateString('pt-BR')}`, leftColX, cardY + 44)
  doc.text(`Data da Citação: ${new Date(dados.data_citacao).toLocaleDateString('pt-BR')}`, rightColX, cardY + 44)
  doc.text(`INPC Acumulado: ${(Number(dados.acumulado_inpc ?? 0) * 100).toFixed(2)}% ${dados.utilizou_fallback ? '(Fallback)' : ''}`, leftColX + 220, cardY + 44)
  doc.moveDown(3)

  doc.moveDown(1)
  doc.fillColor('#2563eb').fontSize(12).text('Detalhamento mensal')

  // Table header with modern styling
  const headers = ['Mês', 'Valor base (R$)', 'INPC (%)', 'Após INPC (R$)', 'Juros (%)', 'Após Juros (R$)']
  const colX = [40, 140, 260, 350, 450, 520]
  const rowHeight = 20
  let y = doc.y + 8
  // header background
  doc.rect(36, y - 6, 523, rowHeight).fill('#2563eb')
  doc.fillColor('#ffffff').fontSize(10)
  headers.forEach((h, i) => doc.text(h, colX[i] - 4, y - 2))
  y += rowHeight

  // rows
  let rowIndex = 0
  for (const linha of dados.tabela_mensal) {
    if (y > 760) { doc.addPage(); y = 40 }
    // alternate row shading
    if (rowIndex % 2 === 0) {
      doc.rect(36, y - 4, 523, rowHeight).fill('#fbfdff')
    }
    doc.fillColor('#0f172a').fontSize(10)
    doc.text(linha.mes, colX[0] - 4, y)
    doc.text(`R$ ${formatCurrency(linha.valor_base)}`, colX[1] - 4, y)
    doc.text(`${Number(linha.inpc_pct ?? 0).toFixed(2)}%`, colX[2] - 4, y)
    doc.text(`R$ ${formatCurrency(linha.apos_inpc)}`, colX[3] - 4, y)
    doc.text(`${Number(linha.juros_pct ?? 0).toFixed(2)}%`, colX[4] - 4, y)
    doc.text(`R$ ${formatCurrency(linha.apos_juros)}`, colX[5] - 4, y)
    y += rowHeight
    rowIndex++
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
