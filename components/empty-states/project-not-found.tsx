import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function ProjectNotFound() {
  return (
    <div className="grid min-h-80 place-items-center text-center">
      <div className="space-y-3">
        <h1>Project not found</h1>
        <p className="text-muted-foreground">
          This project does not exist or you do not have access to it.
        </p>
        <Button render={<Link href="/dashboard/projects" />}>Back to projects</Button>
      </div>
    </div>
  )
}
