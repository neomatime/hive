import { LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading calendar">
      <PageHeaderSkeleton />
      <Skeleton className="h-[32rem] w-full rounded-xl" />
    </LoadingRegion>
  )
}
