import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
type Client = SupabaseClient<Database>
export async function listNotifications(client: Client, userId: string) {
  const result = await client
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  const items = result.data ?? []
  const taskIds = items
    .filter((item) => item.entity_type === 'task' && item.entity_id)
    .map((item) => item.entity_id as string)
  const tasks = taskIds.length
    ? await client.from('tasks').select('id,project_id').in('id', taskIds)
    : { data: [] }
  return items.map((item) => ({
    ...item,
    projectId: tasks.data?.find((task) => task.id === item.entity_id)?.project_id ?? null,
  }))
}
