export interface EmptyProps {
  label?: string
}

export function Empty({ label }: EmptyProps) {
  return <span className="text-sm text-gray-400">{label ?? 'None'}</span>
}
