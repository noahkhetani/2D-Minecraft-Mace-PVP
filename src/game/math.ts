export type Vec2 = { x: number; y: number }

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function sign(v: number) {
  return v < 0 ? -1 : 1
}

export function len(x: number, y: number) {
  return Math.sqrt(x * x + y * y)
}

export function norm(x: number, y: number) {
  const l = len(x, y)
  if (l <= 1e-6) return { x: 0, y: 0 }
  return { x: x / l, y: y / l }
}

export function dot(ax: number, ay: number, bx: number, by: number) {
  return ax * bx + ay * by
}

export function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
) {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by
}

export function randRange(min: number, max: number) {
  return min + Math.random() * (max - min)
}
