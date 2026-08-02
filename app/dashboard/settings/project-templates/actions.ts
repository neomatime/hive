'use server'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
const path = '/dashboard/settings/project-templates'
export async function createTemplateAction(input: {
  name: string
  description: string
  category: string
}) {
  const client = await createClient(),
    current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return { error: 'Could not create template.' }
  const result = await client
    .from('project_templates')
    .insert({
      workspace_id: current.user.workspace.id,
      created_by: current.user.id,
      name: input.name.trim(),
      description: input.description.trim() || null,
      category: input.category.trim() || null,
    })
  if (!result.error) revalidatePath(path)
  return { error: result.error ? 'Could not create template. Admin access is required.' : null }
}
export async function updateTemplateAction(
  id: string,
  input: { name: string; description: string; category: string }
) {
  const result = await (
    await createClient()
  )
    .from('project_templates')
    .update({
      name: input.name.trim(),
      description: input.description.trim() || null,
      category: input.category.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (!result.error) revalidatePath(path)
  return { error: result.error ? 'Could not update template.' : null }
}
export async function duplicateTemplateAction(id: string) {
  const client = await createClient(),
    current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return { error: 'Could not duplicate template.' }
  const source = await client
    .from('project_templates')
    .select('name,description,category,workspace_id')
    .eq('id', id)
    .single()
  if (!source.data) return { error: 'Could not duplicate template.' }
  const result = await client
    .from('project_templates')
    .insert({ ...source.data, name: `${source.data.name} copy`, created_by: current.user.id })
  if (!result.error) revalidatePath(path)
  return { error: result.error ? 'Could not duplicate template.' : null }
}
export async function archiveTemplateAction(id: string) {
  const result = await (
    await createClient()
  )
    .from('project_templates')
    .update({
      is_active: false,
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (!result.error) revalidatePath(path)
  return { error: result.error ? 'Could not archive template.' : null }
}
