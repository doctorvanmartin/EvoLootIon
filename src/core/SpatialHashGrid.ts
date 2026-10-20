export interface SpatialEntity {
  x: number;
  y: number;
}

export class SpatialHashGrid<T extends SpatialEntity> {
  private invCellSize: number;
  private grid: Map<number, T[]> = new Map();

  constructor(cellSize: number = 64) {
    this.invCellSize = 1.0 / cellSize;
  }

  /**
   * Empaqueta coordenadas discretas (cx, cy) en un entero de 32 bits único.
   */
  private hashKey(cx: number, cy: number): number {
    return ((cx & 0xffff) << 16) | (cy & 0xffff);
  }

  /**
   * Vacía las celdas manteniendo los arrays subyacentes en memoria (Zero-GC).
   */
  public clear(): void {
    for (const cell of this.grid.values()) {
      cell.length = 0;
    }
  }

  public insert(entity: T): void {
    const cx = Math.floor(entity.x * this.invCellSize);
    const cy = Math.floor(entity.y * this.invCellSize);
    const key = this.hashKey(cx, cy);

    let cell = this.grid.get(key);
    if (!cell) {
      cell = [];
      this.grid.set(key, cell);
    }
    cell.push(entity);
  }

  public build(entities: readonly T[]): void {
    this.clear();
    for (let i = 0; i < entities.length; i++) {
      this.insert(entities[i]);
    }
  }

  /**
   * Rellena el array `out` con las entidades dentro del radio para evitar alocar arrays nuevos.
   */
  public queryRadius(x: number, y: number, radius: number, out: T[] = []): T[] {
    out.length = 0;
    const radiusSq = radius * radius;

    const minX = Math.floor((x - radius) * this.invCellSize);
    const maxX = Math.floor((x + radius) * this.invCellSize);
    const minY = Math.floor((y - radius) * this.invCellSize);
    const maxY = Math.floor((y + radius) * this.invCellSize);

    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const cell = this.grid.get(this.hashKey(cx, cy));
        if (!cell) continue;

        for (let i = 0; i < cell.length; i++) {
          const item = cell[i];
          const dx = item.x - x;
          const dy = item.y - y;
          if (dx * dx + dy * dy <= radiusSq) {
            out.push(item);
          }
        }
      }
    }
    return out;
  }
}
