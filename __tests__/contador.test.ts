import { aplicarPisoBoost } from '@/lib/contador'

it('aplica piso quando real é baixo', () => {
  expect(aplicarPisoBoost(4, 80, 1)).toBe(80)
})
it('aplica multiplicador e arredonda', () => {
  expect(aplicarPisoBoost(100, 0, 1.5)).toBe(150)
  expect(aplicarPisoBoost(7, 0, 1.4)).toBe(10) // 9.8 -> 10
})
it('usa o maior entre piso e real*mult', () => {
  expect(aplicarPisoBoost(100, 80, 1.5)).toBe(150)
})
