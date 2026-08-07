import { LoadingRegion, PageHeaderSkeleton, TableSkeleton } from '@/components/ui/skeletons'

export default function Loading() {
  return (
    <LoadingRegion label="Loading files">
      <PageHeaderSkeleton />
      <TableSkeleton />
    </LoadingRegion>
  )
}
