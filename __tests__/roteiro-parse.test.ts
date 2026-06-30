import { parseRoteiro } from '@/lib/roteiro-parse'

describe('parseRoteiro', () => {
  it('lê segundos puros', () => {
    expect(parseRoteiro('10 | Ana | Oi')).toEqual([{ delay: 10, name: 'Ana', msg: 'Oi' }])
  })
  it('lê mm:ss e hh:mm:ss', () => {
    const r = parseRoteiro('01:30 | Bia | Olá\n01:00:00 | Caio | Fim')
    expect(r[0].delay).toBe(90)
    expect(r[1].delay).toBe(3600)
  })
  it('ignora linhas em branco', () => {
    expect(parseRoteiro('\n10 | Ana | Oi\n\n')).toHaveLength(1)
  })
  it('mensagem pode conter | extra', () => {
    expect(parseRoteiro('5 | Ana | a | b').at(0)?.msg).toBe('a | b')
  })
  it('lança em linha malformada', () => {
    expect(() => parseRoteiro('xx | Ana | Oi')).toThrow()
    expect(() => parseRoteiro('10 | Ana')).toThrow()
  })
})
