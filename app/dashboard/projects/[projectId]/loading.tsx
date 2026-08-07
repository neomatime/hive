import { ListSkeleton, LoadingRegion } from '@/components/ui/skeletons'
import { Skeleton } from '@/components/ui/skeleton'

export default function Loading() {
  return (
    <LoadingRegion label="Loading project">
      <div className="space-y-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-64 max-w-full" />
        </div>
        <div className="flex gap-5 border-b pb-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-4 w-16" />
          ))}
        </div>
      </div>
      <ListSkeleton rows={5} />
    </LoadingRegion>
  )
}
