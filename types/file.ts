import type { Database } from './database'

export type FileType = Database['public']['Enums']['file_type']
export interface HiveFile {
  id: string
  workspaceId: string
  projectId: string
  projectName: string
  projectCode: string
  taskId: string | null
  uploadedBy: string
  name: string
  storageKey: string
  mimeType: string
  fileType: FileType
  sizeBytes: number
  createdAt: string
}
