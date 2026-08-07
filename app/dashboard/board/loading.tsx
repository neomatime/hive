import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading boards">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </LoadingRegion>
  )
}
