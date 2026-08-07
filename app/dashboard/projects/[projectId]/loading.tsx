import { ListSkeleton, LoadingRegion } from '@/components/ui/skeletons'

// This file is a sibling of layout.tsx, so its fallback renders at the
// {children} position INSIDE ProjectShell -- the real project code, title,
// and tab nav are already on screen above it. Only the tab *content* needs
// a placeholder here; drawing a header would duplicate the real one.
export default function Loading() {
  return (
    <LoadingRegion label="Loading project">
      <ListSkeleton rows={5} />
    </LoadingRegion>
  )
}
