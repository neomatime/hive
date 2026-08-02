import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
type Client = SupabaseClient<Database>
export async function listProjectTemplates(client: Client, workspaceId: string) {
  const result = await client
    .from('project_templates')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
  return result.data ?? []
}
