import type { CalculoResultado } from './calculo'

// Small pluggable wrapper to generate a case-specific legal interpretation
// based on the calculation data. If an AI API key is configured (OPENAI_API_KEY)
// we call OpenAI's Chat Completions API; otherwise we return a conservative
// static text. The function never throws on network errors — it falls back to
// the static interpretation so PDF generation continues to work in CI/servers
// without the API key.

export async function generateInterpretacao(dados: CalculoResultado): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  const fallback = defaultInterpretacao(dados)
  if (!apiKey) return fallback

  try {
    const prompt = buildPrompt(dados)
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Você é um assistente técnico que resume cálculos em linguagem jurídica clara e concisa em português (3-6 frases).' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 400,
      }),
    })

    if (!res.ok) return fallback
    const data = await res.json()
    const text = data?.choices?.[0]?.message?.content
    if (!text || typeof text !== 'string') return fallback
    return text.trim()
  } catch (err) {
    return fallback
  }
}

function buildPrompt(dados: CalculoResultado) {
  // Provide a concise JSON with the essential numbers for the model.
  const resumo = {
    titulo: dados.titulo,
    periodo_inicio: dados.data_inicio,
    periodo_fim: dados.data_final,
    data_citacao: dados.data_citacao,
    valor_base: dados.valor_base,
    valor_corrigido_total: dados.valor_corrigido,
    valor_juros_total: dados.valor_juros,
    valor_final: dados.resultado,
    juros_mensal: dados.juros_mensal,
    inicio_juros: dados.inicio_juros,
    primeira_parcela: dados.tabela_mensal?.[0] ?? null,
    ultima_parcela: dados.tabela_mensal?.[dados.tabela_mensal.length - 1] ?? null,
  }
  return `Gere uma interpretação jurídica breve (3-6 frases) em português, baseada somente nos dados JSON abaixo. Explique como a correção pelo INPC e os juros foram aplicados, se houve prorrata, e destaque os valores totais. Não inclua referências a legislação específica nem crie conclusões factuais além dos dados fornecidos. Dados: ${JSON.stringify(resumo)}`
}

function defaultInterpretacao(dados: CalculoResultado) {
  // Conservative static interpretation used when AI is not available.
  const lines = [
    'Correção pelo INPC foi aplicada a cada parcela desde seu vencimento até a data de atualização informada.',
    `O total corrigido pela inflação é R$ ${Number(dados.valor_corrigido ?? 0).toFixed(2).replace('.', ',')}.`,
    `O total de juros calculado é R$ ${Number(dados.valor_juros ?? 0).toFixed(2).replace('.', ',')}, com taxa mensal informada de ${Number(dados.juros_mensal ?? 0) * 100}%.`,
    'Quando a última parcela é parcial, o sistema aplica proporcionalidade diária (prorrata) para aquele mês.',
    'Verifique a sentença para confirmar marco inicial, taxa de juros e eventual disposição em contrário.'
  ]
  return lines.join(' ')
}
