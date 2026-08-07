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
          <div className="border-b pb-2">
            <Skeleton className="h-5 w-44" />
          </div>
          <ListSkeleton rows={4} />
        </div>
        <div className="space-y-3">
          <div className="border-b pb-2">
            <Skeleton className="h-5 w-36" />
          </div>
          <ListSkeleton rows={4} />
        </div>
      </div>
    </LoadingRegion>
  )
}
