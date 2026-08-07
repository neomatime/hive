import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading settings">
      <PageHeaderSkeleton />
      <CardGridSkeleton cards={6} />
    </LoadingRegion>
  )
}
