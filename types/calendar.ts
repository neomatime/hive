export interface CalendarEvent {
  id: string
  type: 'project' | 'task' | 'meeting' | 'milestone'
  title: string
  date: string
  projectId: string
  projectName: string
  projectCode: string
  completed: boolean
  time?: string
}
