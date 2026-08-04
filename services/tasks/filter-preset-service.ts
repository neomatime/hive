import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'
import type { BoardFilters, FilterPreset } from '@/types/task'

type Client = SupabaseClient<Database>

export async function listFilterPresets(
  client: Client,
  boardId: string,
  userId: string
): Promise<FilterPreset[]> {
  const result = await client
    .from('board_filter_presets')
    .select('id,board_id,name,filters')
    .eq('board_id', boardId)
    .eq('user_id', userId)
  if (result.error || !result.data) return []
  return result.data.map((row) => ({
    id: row.id,
    boardId: row.board_id,
    name: row.name,
    filters: row.filters as unknown as BoardFilters,
  }))
}

export async function saveFilterPreset(
  client: Client,
  input: { boardId: string; userId: string; name: string; filters: BoardFilters }
): Promise<{ preset: FilterPreset | null; error: string | null }> {
  const result = await client
    .from('board_filter_presets')
    .insert({
      board_id: input.boardId,
      user_id: input.userId,
      name: input.name,
      filters: input.filters as unknown as Json,
    })
    .select('id,board_id,name,filters')
    .single()
  if (result.error?.code === '23505') {
    return { preset: null, error: 'You already have a preset with that name.' }
  }
  if (result.error || !result.data) {
    return { preset: null, error: 'Could not save the filter preset.' }
  }
  return {
    preset: {
      id: result.data.id,
      boardId: result.data.board_id,
      name: result.data.name,
      filters: result.data.filters as unknown as BoardFilters,
    },
    error: null,
  }
}

export async function deleteFilterPreset(client: Client, presetId: string) {
  const result = await client.from('board_filter_presets').delete().eq('id', presetId)
  return { error: result.error ? 'Could not delete the filter preset.' : null }
}
