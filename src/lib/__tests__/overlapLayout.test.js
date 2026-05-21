import { describe, it, expect } from 'vitest'
import { layoutOverlap } from '../overlapLayout'

describe('layoutOverlap', () => {
  it('returns empty for empty input', () => {
    expect(layoutOverlap([])).toEqual([])
  })

  it('single item gets col=0, totalCols=1', () => {
    const [r] = layoutOverlap([{ top: 0, bottom: 60 }])
    expect(r.col).toBe(0)
    expect(r.totalCols).toBe(1)
  })

  it('non-overlapping items both go to col=0', () => {
    const r = layoutOverlap([
      { top: 0, bottom: 60 },
      { top: 120, bottom: 180 },
    ])
    expect(r[0].col).toBe(0)
    expect(r[1].col).toBe(0)
    expect(r[0].totalCols).toBe(1)
    expect(r[1].totalCols).toBe(1)
  })

  it('two overlapping items go to different cols', () => {
    const r = layoutOverlap([
      { top: 0, bottom: 60 },
      { top: 30, bottom: 90 },
    ])
    expect(r.map(x => x.col).sort()).toEqual([0, 1])
    expect(r[0].totalCols).toBe(2)
    expect(r[1].totalCols).toBe(2)
  })

  it('three partial overlaps: A-B overlap, B-C overlap, A-C do not', () => {
    // A:0-60, B:30-90, C:75-120 — A&C never overlap, but B overlaps both
    const r = layoutOverlap([
      { id: 'A', top: 0,  bottom: 60 },
      { id: 'B', top: 30, bottom: 90 },
      { id: 'C', top: 75, bottom: 120 },
    ])
    const byId = Object.fromEntries(r.map(x => [x.id, x]))
    // A and C can share a column since they don't overlap
    expect(byId.A.col).not.toBe(byId.B.col)
    expect(byId.B.col).not.toBe(byId.C.col)
    // totalCols for any booking = max overlap depth in its group
    expect(byId.A.totalCols).toBe(2)
    expect(byId.B.totalCols).toBe(2)
    expect(byId.C.totalCols).toBe(2)
  })

  it('three fully overlapping items get cols 0,1,2', () => {
    const r = layoutOverlap([
      { top: 0, bottom: 60 },
      { top: 10, bottom: 70 },
      { top: 20, bottom: 80 },
    ])
    expect(r.map(x => x.col).sort()).toEqual([0, 1, 2])
    expect(r.every(x => x.totalCols === 3)).toBe(true)
  })

  it('identical times still get different cols', () => {
    const r = layoutOverlap([
      { top: 0, bottom: 60 },
      { top: 0, bottom: 60 },
    ])
    expect(r.map(x => x.col).sort()).toEqual([0, 1])
  })

  it('preserves original item properties', () => {
    const r = layoutOverlap([{ id: 'x', top: 0, bottom: 60, foo: 'bar' }])
    expect(r[0].id).toBe('x')
    expect(r[0].foo).toBe('bar')
  })
})
