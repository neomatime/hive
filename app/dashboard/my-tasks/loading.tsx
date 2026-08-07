import { ListSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading my tasks">
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-xl" />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-7 w-20 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <ListSkeleton rows={6} />
    </LoadingRegion>
  )
}
