export function parseTempo(raw: string): number {
  const t = raw.trim()
  if (/^\d+$/.test(t)) return parseInt(t, 10)
  const parts = t.split(':').map(p => p.trim())
  if (parts.length >= 2 && parts.length <= 3 && parts.every(p => /^\d+$/.test(p))) {
    const nums = parts.map(Number)
    return nums.reduce((acc, n) => acc * 60 + n, 0)
  }
  throw new Error(`Tempo inválido: "${raw}"`)
}

export function normalizarLinhas(
  linhas: { tempo: string | number; nome: string; mensagem: string }[],
): { delay: number; name: string; msg: string }[] {
  return linhas.map((l, i) => {
    const nome = String(l.nome ?? '').trim()
    const msg = String(l.mensagem ?? '').trim()
    if (!nome || !msg) throw new Error(`Linha ${i + 1}: nome e mensagem são obrigatórios.`)
    let delay: number
    try { delay = parseTempo(String(l.tempo)) }
    catch { throw new Error(`Linha ${i + 1}: tempo inválido "${l.tempo}".`) }
    return { delay, name: nome, msg }
  })
}

export function parseRoteiro(text: string): { delay: number; name: string; msg: string }[] {
  const out: { delay: number; name: string; msg: string }[] = []
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    const idx1 = line.indexOf('|')
    const idx2 = line.indexOf('|', idx1 + 1)
    if (idx1 < 0 || idx2 < 0) throw new Error(`Linha malformada (use "tempo | nome | mensagem"): "${line}"`)
    const delay = parseTempo(line.slice(0, idx1))
    const name = line.slice(idx1 + 1, idx2).trim()
    const msg = line.slice(idx2 + 1).trim()
    if (!name || !msg) throw new Error(`Nome ou mensagem vazios: "${line}"`)
    out.push({ delay, name, msg })
  }
  return out
}
