import { ListSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading my tasks">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </LoadingRegion>
  )
}
