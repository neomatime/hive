export function SettingsHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6">
      <h1>{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}
