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
        versionNumber: file.version_number,
        createdAt: file.created_at,
      },
    ]
  })
}

export async function renameFile(
  client: Client,
  fileId: string,
  name: string
): Promise<{ error: string | null }> {
  const trimmed = name.trim()
  if (!trimmed) return { error: 'File name cannot be empty.' }
  const result = await client
    .from('files')
    .update({ name: trimmed, updated_at: new Date().toISOString() })
    .eq('id', fileId)
  return { error: result.error ? 'Could not rename file.' : null }
}

export async function replaceFile(
  client: Client,
  target: { id: string; storageKey: string; versionNumber: number },
  file: File
): Promise<{ error: string | null }> {
  if (file.size > 52428800) return { error: 'Files must be 50 MB or smaller.' }
  // Same storage_key as the original upload -- the object already exists, so
  // this relies on a storage UPDATE policy (not just insert), unlike a fresh
  // upload. See the project_files_storage_update migration.
  const uploaded = await client.storage
    .from('project-files')
    .upload(target.storageKey, file, { contentType: file.type, upsert: true })
  if (uploaded.error) return { error: 'Could not upload the replacement file.' }
  const result = await client
    .from('files')
    .update({
      mime_type: file.type,
      size_bytes: file.size,
      version_number: target.versionNumber + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', target.id)
  return {
    error: result.error ? 'Replacement uploaded, but its record could not be updated.' : null,
  }
}
