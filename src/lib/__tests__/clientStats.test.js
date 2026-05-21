import { describe, it, expect } from 'vitest'
import { buildClientStats, getTag } from '../clientStats'

describe('getTag', () => {
  it('classifies by visits count', () => {
    expect(getTag(0)).toBe('new')
    expect(getTag(1)).toBe('new')
    expect(getTag(2)).toBe('regular')
    expect(getTag(4)).toBe('regular')
    expect(getTag(5)).toBe('top')
    expect(getTag(100)).toBe('top')
  })
})

describe('buildClientStats', () => {
  const user = { id: 'u1', displayName: 'Oleh', phone: '+380', email: 'o@x.com' }

  it('handles zero history and bookings', () => {
    const r = buildClientStats(user, [], [])
    expect(r.totalSpent).toBe(0)
    expect(r.visits).toBe(0)
    expect(r.tag).toBe('new')
    expect(r.cars).toEqual([])
  })

  it('sums cost across history', () => {
    const r = buildClientStats(user,
      [{ userId: 'u1', cost: 100 }, { userId: 'u1', cost: '250' }, { userId: 'u2', cost: 999 }],
      []
    )
    expect(r.totalSpent).toBe(350)
  })

  it('treats missing cost as 0', () => {
    const r = buildClientStats(user,
      [{ userId: 'u1' }, { userId: 'u1', cost: null }, { userId: 'u1', cost: 50 }],
      []
    )
    expect(r.totalSpent).toBe(50)
  })

  it('counts visits from booking statuses', () => {
    const r = buildClientStats(user, [],
      [
        { userId: 'u1', status: 'completed' },
        { userId: 'u1', status: 'confirmed' },
        { userId: 'u1', status: 'rejected' },
        { userId: 'u1', status: 'pending' },
      ]
    )
    expect(r.visits).toBe(2)
  })

  it('falls back to history length when no booking visits', () => {
    const r = buildClientStats(user,
      [{ userId: 'u1' }, { userId: 'u1' }, { userId: 'u1' }],
      []
    )
    expect(r.visits).toBe(3)
  })

  it('top tag at 5+ visits', () => {
    const r = buildClientStats(user, [],
      Array.from({ length: 6 }, () => ({ userId: 'u1', status: 'completed' }))
    )
    expect(r.tag).toBe('top')
  })

  it('extracts unique cars from bookings', () => {
    const r = buildClientStats(user, [],
      [
        { userId: 'u1', carBrand: 'BMW', carModel: 'X5' },
        { userId: 'u1', carBrand: 'BMW', carModel: 'X5' }, // duplicate
        { userId: 'u1', carBrand: 'Audi', carModel: 'Q7' },
      ]
    )
    expect(r.cars).toEqual(['BMW X5', 'Audi Q7'])
  })

  it('falls back to plate for offline bookings', () => {
    const r = buildClientStats(user, [],
      [{ userId: 'u1', offlineData: { plate: 'AA1234BB' } }]
    )
    expect(r.cars).toEqual(['AA1234BB'])
  })

  it('uses phone as name when displayName missing', () => {
    const r = buildClientStats({ id: 'u', phone: '+380' }, [], [])
    expect(r.name).toBe('+380')
  })

  it('uses "Без імені" when nothing identifies user', () => {
    const r = buildClientStats({ id: 'u' }, [], [])
    expect(r.name).toBe('Без імені')
  })

  it('picks last date as max across history and bookings', () => {
    const r = buildClientStats(user,
      [{ userId: 'u1', date: '2026-01-01' }],
      [{ userId: 'u1', date: '2026-03-15', status: 'completed' }]
    )
    expect(r.last).toBe('2026-03-15')
  })
})
