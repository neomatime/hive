import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
type Client = SupabaseClient<Database>
export async function globalSearch(client: Client, workspaceId: string, rawQuery: string) {
  const query = rawQuery.trim().slice(0, 100)
  if (query.length < 2) return { projects: [], tasks: [], files: [], people: [] }
  const pattern = `%${query.replace(/[%_]/g, '')}%`
  const memberships = await client
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true)
  const userIds = (memberships.data ?? []).map((item) => item.user_id)
  const [projects, tasks, files, people] = await Promise.all([
    client
      .from('projects')
      .select('id,name,project_code,status')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .ilike('name', pattern)
      .limit(8),
    client
      .from('tasks')
      .select('id,title,project_id,priority')
      .is('deleted_at', null)
      .ilike('title', pattern)
      .limit(8),
    client
      .from('files')
      .select('id,name,project_id,mime_type')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .ilike('name', pattern)
      .limit(8),
    userIds.length
      ? client
          .from('users')
          .select('id,display_name,email,job_title')
          .in('id', userIds)
          .or(`display_name.ilike.${pattern},email.ilike.${pattern}`)
          .limit(8)
      : Promise.resolve({ data: [] }),
  ])
  return {
    projects: projects.data ?? [],
    tasks: tasks.data ?? [],
    files: files.data ?? [],
    people: people.data ?? [],
  }
}
