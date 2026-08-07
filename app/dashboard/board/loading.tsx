import { LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

// Mirrors KanbanBoard's real layout: a filter row, then w-72 columns in a
// horizontally-scrolling flex row (components/tasks/kanban-board.tsx).
export default function Loading() {
  return (
    <LoadingRegion label="Loading board">
      <PageHeaderSkeleton action />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Array.from({ length: 4 }, (_, column) => (
          <div key={column} className="w-72 shrink-0 space-y-3 rounded-md border bg-muted/30 p-3">
            <Skeleton className="h-4 w-24" />
            {Array.from({ length: 3 }, (_, card) => (
              <Skeleton key={card} className="h-20 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
