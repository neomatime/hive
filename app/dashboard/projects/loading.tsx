import { CardGridSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading projects">
      <PageHeaderSkeleton />
      <CardGridSkeleton />
    </LoadingRegion>
  )
}
