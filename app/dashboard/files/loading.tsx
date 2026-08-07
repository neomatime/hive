import { LoadingRegion, PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading files">
      <PageHeaderSkeleton action />
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <TableSkeleton />
    </LoadingRegion>
  )
}
