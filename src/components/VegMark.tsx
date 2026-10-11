export function VegMark({ veg }: { veg: boolean }) {
  const tone = veg ? 'border-green-600 bg-green-600' : 'border-red-600 bg-red-600'
  return (
    <span
      role="img"
      aria-label={veg ? 'Vegetarian' : 'Non-vegetarian'}
      className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border-2 bg-card ${tone.split(' ')[0]}`}
    >
      <span className={`h-2 w-2 rounded-full ${tone.split(' ')[1]}`} />
    </span>
  )
}
