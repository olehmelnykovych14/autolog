export const fmt = n => new Intl.NumberFormat('uk-UA').format(n)

export const fmtCost = n => n === 0 ? 'Безкоштовно' : `${fmt(n)} грн`

export function getBrandLogo(brand) {
  const b = (brand || '').toLowerCase()
  if (b.includes('bmw')) return 'https://cdn.simpleicons.org/bmw/1C69D4'
  if (b.includes('toyota')) return 'https://cdn.simpleicons.org/toyota/EB0A1E'
  if (b.includes('tesla')) return 'https://cdn.simpleicons.org/tesla/CC0000'
  if (b.includes('mercedes')) return 'https://cdn.simpleicons.org/mercedes/333333'
  if (b.includes('audi')) return 'https://cdn.simpleicons.org/audi/888888'
  if (b.includes('volkswagen') || b.includes('vw')) return 'https://cdn.simpleicons.org/volkswagen/001F5E'
  if (b.includes('honda')) return 'https://cdn.simpleicons.org/honda/CC0001'
  if (b.includes('hyundai')) return 'https://cdn.simpleicons.org/hyundai/002C5F'
  if (b.includes('kia')) return 'https://cdn.simpleicons.org/kia/05141F'
  return null
}
