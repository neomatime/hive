import { ListSkeleton, LoadingRegion, PageHeaderSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading search results">
      <PageHeaderSkeleton />
      <ListSkeleton rows={5} />
    </LoadingRegion>
  )
}
