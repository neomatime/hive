import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { HiveFile } from '@/types/file'

type Client = SupabaseClient<Database>

export async function listFiles(
  client: Client,
  workspaceId: string,
  projectId?: string
): Promise<HiveFile[]> {
  let query = client
    .from('files')
    .select('*')
    .eq('workspace_id', workspaceId)
    .is('deleted_at', null)
  if (projectId) query = query.eq('project_id', projectId)
  const result = await query.order('created_at', { ascending: false })
  if (result.error || !result.data?.length) return []
  const projectIds = [...new Set(result.data.map((file) => file.project_id))]
  const projects = await client.from('projects').select('id,name,project_code').in('id', projectIds)
  return result.data.flatMap((file) => {
    const project = projects.data?.find((item) => item.id === file.project_id)
    if (!project) return []
    return [
      {
        id: file.id,
        workspaceId: file.workspace_id,
        projectId: file.project_id,
        projectName: project.name,
        projectCode: project.project_code,
        taskId: file.task_id,
        uploadedBy: file.uploaded_by,
        name: file.name,
        storageKey: file.storage_key,
        mimeType: file.mime_type,
        fileType: file.file_type,
        sizeBytes: file.size_bytes,
        createdAt: file.created_at,
      },
    ]
  })
}
