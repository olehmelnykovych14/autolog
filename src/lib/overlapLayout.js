// Interval graph coloring for overlapping bookings in day view.
// Input: array of { top: number, bottom: number, ...rest }
// Output: same items with assigned { col, totalCols }
export function layoutOverlap(items) {
  if (!items.length) return []
  const sorted = [...items].sort((a, b) => a.top - b.top || a.bottom - b.bottom)
  const cols = [] // cols[i] = bottom-time of last interval in column i
  sorted.forEach(b => {
    let placed = false
    for (let i = 0; i < cols.length; i++) {
      if (cols[i] <= b.top) { b.col = i; cols[i] = b.bottom; placed = true; break }
    }
    if (!placed) { b.col = cols.length; cols.push(b.bottom) }
  })
  sorted.forEach(b => {
    const overlapping = sorted.filter(o => o.top < b.bottom && o.bottom > b.top)
    b.totalCols = Math.max(...overlapping.map(o => o.col)) + 1
  })
  return sorted
}
