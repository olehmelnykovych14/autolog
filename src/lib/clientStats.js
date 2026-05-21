// Aggregate client statistics from history + bookings
export function getTag(visits) {
  if (visits >= 5) return 'top'
  if (visits >= 2) return 'regular'
  return 'new'
}

export function buildClientStats(user, hist, books) {
  const userHist  = hist.filter(h => h.userId === user.id)
  const userBooks = books.filter(b => b.userId === user.id)
  const totalSpent = userHist.reduce((s, h) => s + (Number(h.cost) || 0), 0)
  const visits = userBooks.filter(b =>
    ['completed','done','confirmed','in-progress'].includes(b.status)
  ).length || userHist.length
  const lastDates = [...userBooks.map(b => b.date), ...userHist.map(h => h.date)]
    .filter(Boolean).sort().reverse()
  const cars = [...new Set(userBooks.map(b =>
    b.carBrand && b.carModel
      ? `${b.carBrand} ${b.carModel}`
      : b.offlineData?.plate || ''
  ).filter(Boolean))]

  return {
    id: user.id,
    name: user.displayName || user.name || user.fullName || user.phone || 'Без імені',
    phone: user.phone || '',
    email: user.email || '',
    cars,
    visits,
    totalSpent,
    last: lastDates[0] || '',
    tag: getTag(visits),
  }
}
