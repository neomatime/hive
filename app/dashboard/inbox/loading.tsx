import { LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading inbox">
      <PageHeaderSkeleton />
      <div className="flex gap-2 border-b pb-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-7 w-16 rounded-full" />
        ))}
      </div>
      <div className="divide-y rounded-md border">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="space-y-2 p-5">
            <Skeleton className="h-4 w-full max-w-80" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    </LoadingRegion>
  )
}
