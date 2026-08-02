'use client'

import { useMemo, useRef, useState } from 'react'
import { Download, FileText, Search, Trash2, Upload } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Project } from '@/types/project'
import type { FileType, HiveFile } from '@/types/file'

const allowed = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/png',
  'image/jpeg',
  'application/zip',
])
function fileType(mime: string): FileType {
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  if (mime.includes('spreadsheet') || mime.includes('excel')) return 'spreadsheet'
  if (mime.includes('presentation') || mime.includes('powerpoint')) return 'presentation'
  if (mime.includes('zip')) return 'archive'
  if (mime.includes('word')) return 'document'
  return 'other'
}
function size(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1048576).toFixed(1)} MB`
}

export function FilesDashboard({
  initialFiles,
  projects,
  workspaceId,
  userId,
  fixedProjectId,
}: {
  initialFiles: HiveFile[]
  projects: Project[]
  workspaceId: string
  userId: string
  fixedProjectId?: string
}) {
  const [files, setFiles] = useState(initialFiles),
    [search, setSearch] = useState(''),
    [projectId, setProjectId] = useState(fixedProjectId ?? projects[0]?.id ?? ''),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null)
  const picker = useRef<HTMLInputElement>(null)
  const visible = useMemo(
    () =>
      files.filter((file) =>
        `${file.name} ${file.projectName}`.toLowerCase().includes(search.toLowerCase())
      ),
    [files, search]
  )
  async function upload(file: File) {
    if (!projectId) return setError('Select a project first.')
    if (!allowed.has(file.type)) return setError('Unsupported file type.')
    if (file.size > 52428800) return setError('Files must be 50 MB or smaller.')
    setBusy(true)
    setError(null)
    const client = createClient(),
      safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '-'),
      storageKey = `${workspaceId}/${projectId}/${crypto.randomUUID()}-${safe}`
    const stored = await client.storage
      .from('project-files')
      .upload(storageKey, file, { contentType: file.type })
    if (stored.error) {
      setBusy(false)
      return setError('Could not upload file.')
    }
    const metadata = await client
      .from('files')
      .insert({
        workspace_id: workspaceId,
        project_id: projectId,
        uploaded_by: userId,
        name: file.name,
        storage_key: storageKey,
        mime_type: file.type,
        file_type: fileType(file.type),
        size_bytes: file.size,
      })
      .select()
      .single()
    if (metadata.error || !metadata.data) {
      await client.storage.from('project-files').remove([storageKey])
      setBusy(false)
      return setError('Could not save file details.')
    }
    const project = projects.find((item) => item.id === projectId)!
    setFiles((current) => [
      {
        id: metadata.data.id,
        workspaceId,
        projectId,
        projectName: project.name,
        projectCode: project.projectCode,
        taskId: null,
        uploadedBy: userId,
        name: file.name,
        storageKey,
        mimeType: file.type,
        fileType: metadata.data.file_type,
        sizeBytes: file.size,
        createdAt: metadata.data.created_at,
      },
      ...current,
    ])
    setBusy(false)
  }
  async function download(file: HiveFile) {
    const result = await createClient()
      .storage.from('project-files')
      .createSignedUrl(file.storageKey, 60, { download: file.name })
    if (result.data) window.open(result.data.signedUrl, '_blank', 'noopener,noreferrer')
    else setError('Could not download file.')
  }
  async function remove(file: HiveFile) {
    if (!window.confirm(`Delete ${file.name}?`)) return
    const client = createClient()
    const object = await client.storage.from('project-files').remove([file.storageKey])
    if (object.error) return setError('Could not delete file.')
    const metadata = await client
      .from('files')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', file.id)
    if (metadata.error) return setError('File removed, but its record could not be updated.')
    setFiles((current) => current.filter((item) => item.id !== file.id))
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1>{fixedProjectId ? 'Project files' : 'Files'}</h1>
          <p className="text-muted-foreground">Upload and find project documents securely.</p>
        </div>
        <Button disabled={busy || !projectId} onClick={() => picker.current?.click()}>
          <Upload />
          {busy ? 'Uploading…' : 'Upload file'}
        </Button>
        <input
          ref={picker}
          type="file"
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.zip"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) upload(file)
            event.target.value = ''
          }}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative">
          <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            aria-label="Search files"
            className="pl-9"
            placeholder="Search files or projects…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        {!fixedProjectId && (
          <select
            aria-label="Upload project"
            className="h-8 rounded-lg border bg-background px-3 text-sm"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
          >
            <option value="">Select upload project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {visible.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <FileText className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h2>No files found</h2>
          <p className="text-sm text-muted-foreground">
            Upload a supported project file to get started.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <div className="grid grid-cols-[minmax(0,1fr)_150px_90px_90px] gap-3 bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span>Name</span>
            <span>Project</span>
            <span>Size</span>
            <span>Actions</span>
          </div>
          {visible.map((file) => (
            <div
              key={file.id}
              className="grid grid-cols-[minmax(0,1fr)_150px_90px_90px] items-center gap-3 border-t px-4 py-3 text-sm"
            >
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="size-4 shrink-0" />
                <span className="truncate">{file.name}</span>
              </div>
              <span className="truncate text-muted-foreground">{file.projectCode}</span>
              <span className="text-muted-foreground">{size(file.sizeBytes)}</span>
              <div className="flex">
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Download ${file.name}`}
                  onClick={() => download(file)}
                >
                  <Download />
                </Button>
                <Button
                  size="icon-sm"
                  variant="ghost"
                  aria-label={`Delete ${file.name}`}
                  onClick={() => remove(file)}
                >
                  <Trash2 />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
