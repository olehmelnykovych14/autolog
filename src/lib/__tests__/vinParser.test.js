import { describe, it, expect } from 'vitest'
import { parseVinResponse } from '../vinParser'

const make = (vars) => ({
  Results: Object.entries(vars).map(([Variable, Value]) => ({ Variable, Value })),
})

const brandsModels = {
  BMW: ['1 Series', '3 Series', 'X5'],
  Audi: ['A4', 'Q7'],
}

describe('parseVinResponse', () => {
  it('returns null if Make is missing/null/0', () => {
    expect(parseVinResponse(make({ Make: '' }))).toBeNull()
    expect(parseVinResponse(make({ Make: 'null' }))).toBeNull()
    expect(parseVinResponse(make({ Make: '0' }))).toBeNull()
    expect(parseVinResponse(make({}))).toBeNull()
  })

  it('returns basic decode without brandsModels', () => {
    const r = parseVinResponse(make({ Make: 'BMW', Model: 'X5', 'Model Year': '2020' }))
    expect(r).toMatchObject({ brand: 'BMW', model: 'X5', year: 2020 })
  })

  it('matches brand case-insensitive against brandsModels', () => {
    const r = parseVinResponse(
      make({ Make: 'BMW', Model: 'X5', 'Model Year': '2020' }),
      brandsModels
    )
    expect(r.brand).toBe('BMW')
    expect(r.model).toBe('X5')
  })

  it('falls back to Series when Model is empty', () => {
    const r = parseVinResponse(make({ Make: 'BMW', Model: '', Series: '3 Series' }))
    expect(r.model).toBe('3 Series')
  })

  it('falls back to Trim when Model and Series are empty', () => {
    const r = parseVinResponse(make({ Make: 'BMW', Model: '', Series: '', Trim: 'M Sport' }))
    expect(r.model).toBe('M Sport')
  })

  it('does NOT default to alphabetical first model when raw not in brandsModels', () => {
    // BUG D regression: previously returned '1 Series' (alphabetically first)
    const r = parseVinResponse(
      make({ Make: 'BMW', Model: 'i8' }),
      brandsModels
    )
    expect(r.model).toBe('i8')
    expect(r.model).not.toBe('1 Series')
  })

  it('treats "Not Applicable" as empty', () => {
    const r = parseVinResponse(make({ Make: 'BMW', 'Fuel Type - Primary': 'Not Applicable' }))
    expect(r.fuelType).toBe('')
  })

  it('extracts tech specs', () => {
    const r = parseVinResponse(make({
      Make: 'BMW',
      'Displacement (L)': '3.0',
      'Engine Number of Cylinders': '6',
      'Fuel Type - Primary': 'Gasoline',
      'Drive Type': 'AWD',
      'Transmission Style': 'Automatic',
      'Body Class': 'Sport Utility Vehicle (SUV)',
    }))
    expect(r.engineL).toBe('3.0')
    expect(r.engineCyl).toBe('6')
    expect(r.fuelType).toBe('Gasoline')
    expect(r.driveType).toBe('AWD')
    expect(r.transmission).toBe('Automatic')
    expect(r.bodyClass).toBe('Sport Utility Vehicle (SUV)')
  })

  it('returns null year when not parseable', () => {
    const r = parseVinResponse(make({ Make: 'BMW', 'Model Year': '' }))
    expect(r.year).toBeNull()
  })
})
