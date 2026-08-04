import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>

export async function listTaskWatcherIds(client: Client, taskId: string): Promise<string[]> {
  const result = await client.from('task_watchers').select('user_id').eq('task_id', taskId)
  if (result.error || !result.data) return []
  return result.data.map((row) => row.user_id)
}

export async function watchTask(client: Client, taskId: string, userId: string) {
  const result = await client.from('task_watchers').insert({ task_id: taskId, user_id: userId })
  return { error: result.error ? 'Could not watch task.' : null }
}

export async function unwatchTask(client: Client, taskId: string, userId: string) {
  const result = await client
    .from('task_watchers')
    .delete()
    .eq('task_id', taskId)
    .eq('user_id', userId)
  return { error: result.error ? 'Could not unwatch task.' : null }
}
