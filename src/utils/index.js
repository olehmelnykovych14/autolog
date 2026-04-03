export const fmt = n => new Intl.NumberFormat('uk-UA').format(n)

export const fmtCost = n => n === 0 ? 'Безкоштовно' : `${fmt(n)} грн`

const BRAND_LOGOS = {
  'acura': 'https://cdn.simpleicons.org/acura/004A99',
  'alfa romeo': 'https://cdn.simpleicons.org/alfaromeo/900000',
  'aston martin': 'https://cdn.simpleicons.org/astonmartin/006940',
  'audi': 'https://cdn.simpleicons.org/audi/888888',
  'bentley': 'https://cdn.simpleicons.org/bentley/333',
  'bmw': 'https://cdn.simpleicons.org/bmw/1C69D4',
  'bugatti': 'https://cdn.simpleicons.org/bugatti/BE0030',
  'buick': 'https://cdn.simpleicons.org/buick/333',
  'cadillac': 'https://cdn.simpleicons.org/cadillac/C0A14F',
  'chevrolet': 'https://cdn.simpleicons.org/chevrolet/CD9E1A',
  'chrysler': 'https://cdn.simpleicons.org/chrysler/333',
  'citroën': 'https://cdn.simpleicons.org/citroen/333',
  'citroen': 'https://cdn.simpleicons.org/citroen/333',
  'dacia': 'https://cdn.simpleicons.org/dacia/646B52',
  'dodge': 'https://cdn.simpleicons.org/dodge/333',
  'ferrari': 'https://cdn.simpleicons.org/ferrari/FF2800',
  'fiat': 'https://cdn.simpleicons.org/fiat/960014',
  'ford': 'https://cdn.simpleicons.org/ford/003478',
  'genesis': 'https://cdn.simpleicons.org/genesis/333',
  'honda': 'https://cdn.simpleicons.org/honda/CC0001',
  'hyundai': 'https://cdn.simpleicons.org/hyundai/002C5F',
  'infiniti': 'https://cdn.simpleicons.org/infiniti/333',
  'jaguar': 'https://cdn.simpleicons.org/jaguar/333',
  'jeep': 'https://cdn.simpleicons.org/jeep/333',
  'kia': 'https://cdn.simpleicons.org/kia/05141F',
  'lamborghini': 'https://cdn.simpleicons.org/lamborghini/DDB321',
  'land rover': 'https://cdn.simpleicons.org/landrover/005A2B',
  'lexus': 'https://cdn.simpleicons.org/lexus/333',
  'lincoln': 'https://cdn.simpleicons.org/lincoln/333',
  'maserati': 'https://cdn.simpleicons.org/maserati/002C6A',
  'mazda': 'https://cdn.simpleicons.org/mazda/333',
  'mclaren': 'https://cdn.simpleicons.org/mclaren/FF6600',
  'mercedes-benz': 'https://cdn.simpleicons.org/mercedes/333',
  'mercedes': 'https://cdn.simpleicons.org/mercedes/333',
  'mini': 'https://cdn.simpleicons.org/mini/333',
  'mitsubishi': 'https://cdn.simpleicons.org/mitsubishi/E60012',
  'nissan': 'https://cdn.simpleicons.org/nissan/C3002F',
  'peugeot': 'https://cdn.simpleicons.org/peugeot/333',
  'polestar': 'https://cdn.simpleicons.org/polestar/333',
  'porsche': 'https://cdn.simpleicons.org/porsche/333',
  'ram': 'https://cdn.simpleicons.org/ram/333',
  'renault': 'https://cdn.simpleicons.org/renault/FFCC33',
  'rivian': 'https://cdn.simpleicons.org/rivian/333',
  'rolls-royce': 'https://cdn.simpleicons.org/rollsroyce/680021',
  'skoda': 'https://cdn.simpleicons.org/skoda/4BA82E',
  'subaru': 'https://cdn.simpleicons.org/subaru/013C74',
  'suzuki': 'https://cdn.simpleicons.org/suzuki/E30613',
  'tesla': 'https://cdn.simpleicons.org/tesla/CC0000',
  'toyota': 'https://cdn.simpleicons.org/toyota/EB0A1E',
  'volkswagen': 'https://cdn.simpleicons.org/volkswagen/001F5E',
  'volvo': 'https://cdn.simpleicons.org/volvo/003057',
}

const BRAND_MAPPING = {
  'mercedes-benz': 'mercedes',
  'mercedes': 'mercedes',
  'skoda': 'skoda',
  'land rover': 'landrover',
  'alfa romeo': 'alfaromeo',
  'aston martin': 'astonmartin',
  'rolls-royce': 'rollsroyce',
  'acura': 'acura'
}

export function getBrandLogo(brand) {
  if (!brand) return null
  const b = brand.toLowerCase().trim()
  const slug = BRAND_MAPPING[b] || b.replace(/\s+/g, '')
  return BRAND_LOGOS[b] || `https://cdn.simpleicons.org/${slug}/333`
}


