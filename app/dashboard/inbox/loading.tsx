import { ListSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading inbox">
      <PageHeaderSkeleton />
      <ListSkeleton rows={6} />
    </LoadingRegion>
  )
}
