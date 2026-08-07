import { LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading search results">
      <PageHeaderSkeleton />
      <div className="grid gap-5 lg:grid-cols-2">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="space-y-3 rounded-xl border bg-card p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full max-w-64" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
