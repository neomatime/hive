'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
export function GlobalSearchBox() {
  const [query, setQuery] = useState(''),
    router = useRouter()
  return (
    <form
      className="relative hidden w-full max-w-md md:block"
      role="search"
      onSubmit={(event) => {
        event.preventDefault()
        const value = query.trim()
        if (value.length >= 2) router.push(`/dashboard/search?q=${encodeURIComponent(value)}`)
      }}
    >
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        aria-label="Search HIVE"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search projects, tasks, files, people…"
        className="h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
      />
    </form>
  )
}
