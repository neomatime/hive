import { LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading calendar">
      <div className="flex justify-end">
        <Skeleton className="h-8 w-28" />
      </div>
      <PageHeaderSkeleton />
      <Skeleton className="h-[32rem] w-full rounded-xl" />
    </LoadingRegion>
  )
}
