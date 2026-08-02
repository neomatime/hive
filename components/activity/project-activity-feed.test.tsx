import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectActivityFeed } from './project-activity-feed'
import type { ProjectActivity } from '@/types/activity'

const activity: ProjectActivity[] = [
  {
    id: '1',
    action: 'task_created',
    entityType: 'task',
    entityId: 't1',
    userId: 'u1',
    userName: 'Neo',
    metadata: { title: 'Prepare brief' },
    createdAt: '2026-08-03T08:00:00Z',
  },
  {
    id: '2',
    action: 'file_uploaded',
    entityType: 'file',
    entityId: 'f1',
    userId: 'u1',
    userName: 'Neo',
    metadata: { name: 'brief.pdf' },
    createdAt: '2026-08-03T09:00:00Z',
  },
]
describe('ProjectActivityFeed', () => {
  it('renders immutable timeline entries', () => {
    render(<ProjectActivityFeed activity={activity} />)
    expect(screen.getByText('Prepare brief')).toBeInTheDocument()
    expect(screen.getByText('brief.pdf')).toBeInTheDocument()
  })
  it('filters by activity type', async () => {
    const user = userEvent.setup()
    render(<ProjectActivityFeed activity={activity} />)
    await user.selectOptions(screen.getByLabelText('Filter activity'), 'file_uploaded')
    expect(screen.getByText('brief.pdf')).toBeInTheDocument()
    expect(screen.queryByText('Prepare brief')).not.toBeInTheDocument()
  })
})
