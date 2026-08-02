export interface CalendarEvent {
  id: string
  type: 'project' | 'task'
  title: string
  date: string
  projectId: string
  projectName: string
  projectCode: string
  completed: boolean
}
