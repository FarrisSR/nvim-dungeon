import type { Tile, Vec2 } from '../types/game'

// Recursive shadowcasting FOV (Björn Johannesson octant method)

type IsOpaque = (x: number, y: number) => boolean

// Octant transforms: maps local (row, col) to world (dx, dy) per octant
const OCTANTS: [number, number, number, number][] = [
  [ 1,  0,  0,  1],
  [ 0,  1,  1,  0],
  [ 0, -1,  1,  0],
  [-1,  0,  0,  1],
  [-1,  0,  0, -1],
  [ 0, -1, -1,  0],
  [ 0,  1, -1,  0],
  [ 1,  0,  0, -1],
]

function castLight(
  visible: Set<string>,
  originX: number,
  originY: number,
  radius: number,
  row: number,
  startSlope: number,
  endSlope: number,
  xx: number, xy: number, yx: number, yy: number,
  isOpaque: IsOpaque,
  width: number,
  height: number,
) {
  if (startSlope < endSlope) return

  let nextStartSlope = startSlope
  for (let i = row; i <= radius; i++) {
    let blocked = false
    for (let dx = -i; dx <= 0; dx++) {
      const dy = -i
      const lSlope = (dx - 0.5) / (dy + 0.5)
      const rSlope = (dx + 0.5) / (dy - 0.5)

      if (startSlope < rSlope) continue
      if (endSlope > lSlope) break

      const wx = originX + dx * xx + dy * xy
      const wy = originY + dx * yx + dy * yy

      if (wx >= 0 && wx < width && wy >= 0 && wy < height) {
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist <= radius) {
          visible.add(`${wx},${wy}`)
        }
      }

      if (blocked) {
        if (wx < 0 || wx >= width || wy < 0 || wy >= height || isOpaque(wx, wy)) {
          nextStartSlope = rSlope
          continue
        } else {
          blocked = false
          startSlope = nextStartSlope
        }
      } else if (wx >= 0 && wx < width && wy >= 0 && wy < height && isOpaque(wx, wy) && i < radius) {
        blocked = true
        castLight(
          visible, originX, originY, radius,
          i + 1, startSlope, lSlope,
          xx, xy, yx, yy, isOpaque, width, height
        )
        nextStartSlope = rSlope
      }
    }
    if (blocked) break
  }
}

export function computeFOV(
  tiles: Tile[][],
  origin: Vec2,
  radius: number,
): void {
  const height = tiles.length
  const width = height > 0 ? tiles[0].length : 0

  const isOpaque = (x: number, y: number) =>
    tiles[y]?.[x]?.kind === 'wall'

  const visible = new Set<string>()
  visible.add(`${origin.x},${origin.y}`)

  for (const [xx, xy, yx, yy] of OCTANTS) {
    castLight(
      visible, origin.x, origin.y, radius,
      1, 1.0, 0.0,
      xx, xy, yx, yy, isOpaque, width, height
    )
  }

  // Apply to tiles
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = tiles[y][x]
      const isVis = visible.has(`${x},${y}`)
      tile.visible = isVis
      if (isVis) tile.explored = true
    }
  }
}
