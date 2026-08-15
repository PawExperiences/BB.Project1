type EmptyProps = {
  label?: string
}

export function Empty({ label }: EmptyProps) {
  return <p className="text-gray-400">{label ?? 'None'}</p>
}
