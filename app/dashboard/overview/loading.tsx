import {
  ListSkeleton,
  LoadingRegion,
  PageHeaderSkeleton,
  StatTilesSkeleton,
} from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading overview">
      <PageHeaderSkeleton />
      <StatTilesSkeleton />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-5 w-44" />
          <ListSkeleton rows={4} />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-5 w-36" />
          <ListSkeleton rows={4} />
        </div>
      </div>
    </LoadingRegion>
  )
}
