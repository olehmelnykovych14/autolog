// Pure VIN response parser. Decoupled from React state and BRANDS_MODELS shape.
// Input: NHTSA decodevin JSON `{ Results: [{ Variable, Value }] }`, optional brands map.
// Output: { brand, model, year, engineL, engineCyl, fuelType, driveType, transmission, bodyClass } or null.
export function parseVinResponse(data, brandsModels) {
  const get = v => {
    const val = data?.Results?.find(r => r.Variable === v)?.Value
    return (!val || val === 'null' || val === '0' || val === 'Not Applicable') ? '' : val
  }
  const make = get('Make')
  if (!make) return null
  const rawModel = get('Model') || get('Series') || get('Trim')
  const year = get('Model Year')

  let brand = make
  let model = rawModel
  if (brandsModels) {
    const brandKey = Object.keys(brandsModels).find(b => b.toLowerCase() === make.toLowerCase())
    if (brandKey) {
      brand = brandKey
      const matched = brandsModels[brandKey].find(m => m.toLowerCase() === rawModel.toLowerCase())
      // If no match found, keep raw model — do NOT default to alphabetical first
      model = matched || rawModel
    }
  }

  return {
    brand,
    model,
    year: parseInt(year) || null,
    engineL:      get('Displacement (L)'),
    engineCyl:    get('Engine Number of Cylinders'),
    fuelType:     get('Fuel Type - Primary'),
    driveType:    get('Drive Type'),
    transmission: get('Transmission Style'),
    bodyClass:    get('Body Class'),
  }
}
