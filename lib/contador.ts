export function aplicarPisoBoost(real: number, piso: number, mult: number): number {
  return Math.max(piso, Math.round(real * mult))
}
