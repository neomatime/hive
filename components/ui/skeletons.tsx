import { Skeleton } from '@/components/ui/skeleton'

// Composable placeholders shaped like the app's real content, for use in
// route-level loading.tsx files. Reduced motion needs no handling here --
// styles/animations.css clamps every animation app-wide, including
// Skeleton's animate-pulse.

// A screen reader should hear "Loading projects" once, not a wall of empty
// boxes -- so the placeholders are hidden and a single status label speaks
// for them.
export function LoadingRegion({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="space-y-8">
        {children}
      </div>
    </div>
  )
}

export function PageHeaderSkeleton({ action = false }: { action?: boolean } = {}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      {action && <Skeleton className="h-8 w-32 shrink-0" />}
    </div>
  )
}

// Matches the Overview page's bordered, divided 3-across figure row.
export function StatTilesSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid divide-y rounded-md border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="space-y-3 p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-8 w-12" />
        </div>
      ))}
    </div>
  )
}

// Matches the divide-y bordered lists used for deadlines, activity, tasks,
// and notifications.
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y rounded-md border">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-between gap-3 p-3">
          <Skeleton className="h-4 w-full max-w-64" />
          <Skeleton className="h-3 w-14 shrink-0" />
        </div>
      ))}
    </div>
  )
}

// Matches ProjectDirectory / BoardPicker's card grid.
export function CardGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: cards }, (_, index) => (
        <div key={index} className="space-y-3 rounded-xl border bg-card p-5">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-5 w-40 max-w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-1.5 w-full rounded-full" />
          <div className="border-t pt-3">
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Matches the Files table's four-column grid.
export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid grid-cols-[minmax(0,1fr)_150px_90px_170px] gap-3 bg-muted/50 px-4 py-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-10" />
        <Skeleton className="h-3 w-14" />
      </div>
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[minmax(0,1fr)_150px_90px_170px] items-center gap-3 border-t px-4 py-3"
        >
          <Skeleton className="h-4 w-full max-w-56" />
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-7 w-24" />
        </div>
      ))}
    </div>
  )
}
