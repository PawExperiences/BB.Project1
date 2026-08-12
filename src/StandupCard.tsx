export interface StandupCardProps {
  yesterday: string[]
  today: string[]
  blockers: string[]
}

interface StandupSectionProps {
  label: string
  items: string[]
}

function StandupSection({ label, items }: StandupSectionProps) {
  return (
    <section className="mb-4 last:mb-0">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
        {label}
      </h2>
      <ul className="list-inside list-disc space-y-1 text-gray-800">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </section>
  )
}

export function StandupCard({ yesterday, today, blockers }: StandupCardProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <StandupSection label="Yesterday" items={yesterday} />
      <StandupSection label="Today" items={today} />
      <StandupSection label="Blockers" items={blockers} />
    </div>
  )
}
