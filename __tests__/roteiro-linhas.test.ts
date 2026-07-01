import { normalizarLinhas } from '@/lib/roteiro-parse'

it('normaliza linhas válidas (segundos e mm:ss)', () => {
  expect(normalizarLinhas([
    { tempo: '10', nome: 'Ana', mensagem: 'Oi' },
    { tempo: '01:30', nome: 'Bia', mensagem: 'Olá' },
  ])).toEqual([
    { delay: 10, name: 'Ana', msg: 'Oi' },
    { delay: 90, name: 'Bia', msg: 'Olá' },
  ])
})
it('aceita tempo numérico', () => {
  expect(normalizarLinhas([{ tempo: 5, nome: 'X', mensagem: 'y' }])[0].delay).toBe(5)
})
it('lança na linha com nome/mensagem vazios', () => {
  expect(() => normalizarLinhas([{ tempo: '1', nome: '', mensagem: 'y' }])).toThrow(/linha 1/i)
})
it('lança em tempo inválido', () => {
  expect(() => normalizarLinhas([{ tempo: 'xx', nome: 'A', mensagem: 'b' }])).toThrow()
})
