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

  // rows (parcela-oriented table)
  let rowIndex = 0
  // smaller font for dense table
  const rowFontSize = 9
  for (const linha of dados.tabela_mensal) {
    if (y > 760) { doc.addPage(); y = 40 }
    // alternate row shading
    if (rowIndex % 2 === 0) {
      doc.rect(36, y - 4, 523, rowHeight).fill('#fbfdff')
    }
    doc.fillColor('#0f172a').fontSize(rowFontSize)
    // Columns: Parcela, Vencimento, Valor Original, INPC %, Valor Corrigido, Meses Juros, Juros (R$), Total (R$)
    const cx = [40, 90, 160, 240, 320, 400, 460, 520]
    doc.text(linha.mes, cx[0] - 4, y)
    doc.text(linha.vencimento, cx[1] - 4, y)
    doc.text(`R$ ${formatCurrency(linha.valor_original)}`, cx[2] - 4, y)
    doc.text(`${Number(linha.inpc_acumulado_pct ?? 0).toFixed(2)}%`, cx[3] - 4, y)
    doc.text(`R$ ${formatCurrency(linha.valor_corrigido)}`, cx[4] - 4, y)
    doc.text(String(linha.meses_juros), cx[5] - 4, y)
    doc.text(`R$ ${formatCurrency(linha.juros_valor)}`, cx[6] - 4, y)
    doc.text(`R$ ${formatCurrency(linha.total)}`, cx[7] - 20, y)
    y += rowHeight
    rowIndex++
  }

  doc.addPage()
  // Totals card
  doc.addPage()
  doc.fillColor('#2563eb').fontSize(14).text('Totais', { underline: false })
  doc.moveDown(0.5)
  const tcardX = 40
  const tcardW = 300
  const tcardY = doc.y
  doc.rect(tcardX, tcardY, tcardW, 90).fill('#f8fafc')
  doc.fillColor('#0f172a').fontSize(11)
  doc.text(`Valor total com INPC: R$ ${formatCurrency(dados.valor_corrigido)}`, tcardX + 12, tcardY + 12)
  doc.text(`Valor total apenas de juros: R$ ${formatCurrency(dados.valor_juros)}`, tcardX + 12, tcardY + 32)
  doc.fontSize(12).fillColor('#0b74ff').text(`Valor total geral: R$ ${formatCurrency(dados.resultado)}`, tcardX + 12, tcardY + 56)

  doc.moveDown(6)

  doc.end()
  return done
}

// Seção de interpretação jurídica (texto fixo). Não usei AI aqui — se quiser, posso integrar um serviço
// de geração de texto mais tarde. O texto abaixo segue a explicação padrão adotada no sistema.
function renderInterpretacao(doc: any, yStart: number) {
  let y = yStart
  doc.fontSize(12).fillColor('#0f172a').text('Interpretação jurídica', 40, y)
  y += 18
  doc.fontSize(10).fillColor('#0f172a')
  const bullets = [
    'Correção (INPC): aplicada desde o vencimento de cada parcela; recomposição inflacionária.',
    'Juros (1% a.m.): contados desde a citação apenas sobre parcelas já vencidas; para parcelas posteriores, incidem a partir do vencimento.',
    'Atualização parcial (meio mês): o sistema aplica proporcionalidade diária quando a parcela final for parcial.',
    'Caso a sentença fixe outra taxa ou outro marco, substitua os parâmetros conforme indicado.'
  ]
  for (const b of bullets) {
    doc.circle(44, y + 4, 2).fill('#0b74ff')
    doc.fillColor('#0f172a').text(b, 52, y, { width: 480 })
    y += 16
  }
}
