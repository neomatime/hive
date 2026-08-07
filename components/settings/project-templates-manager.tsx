'use client'
import { useState } from 'react'
import {
  archiveTemplateAction,
  createTemplateAction,
  duplicateTemplateAction,
  updateTemplateAction,
} from '@/app/dashboard/settings/project-templates/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
type Template = Awaited<
  ReturnType<typeof import('@/services/settings/template-service').listProjectTemplates>
>[number]
export function ProjectTemplatesManager({
  templates,
  canEdit,
}: {
  templates: Template[]
  canEdit: boolean
}) {
  const [error, setError] = useState<string | null>(null),
    [editing, setEditing] = useState<string | null>(null)
  async function submit(event: React.FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const input = {
      name: String(data.get('name')),
      description: String(data.get('description')),
      category: String(data.get('category')),
    }
    const result = id ? await updateTemplateAction(id, input) : await createTemplateAction(input)
    setError(result.error)
    if (!result.error) {
      event.currentTarget.reset()
      setEditing(null)
    }
  }
  return (
    <div className="space-y-6">
      {canEdit && (
        <form
          onSubmit={(event) => submit(event)}
          className="grid max-w-3xl gap-3 rounded-xl border bg-card p-5 sm:grid-cols-2"
        >
          <h2 className="sm:col-span-2 text-base font-medium">New template</h2>
          <Input name="name" placeholder="Template name" required />
          <Input name="category" placeholder="Category" />
          <Input
            name="description"
            placeholder="What is this template for?"
            className="sm:col-span-2"
          />
          <Button type="submit" className="sm:col-span-2 sm:w-fit">
            Create template
          </Button>
        </form>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2>No templates yet</h2>
          <p className="text-sm text-muted-foreground">
            Create a reusable structure for your team.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {templates.map((template) =>
            editing === template.id ? (
              <form
                key={template.id}
                onSubmit={(event) => submit(event, template.id)}
                className="space-y-3 rounded-xl border bg-card p-5"
              >
                <Input name="name" defaultValue={template.name} required />
                <Input name="category" defaultValue={template.category ?? ''} />
                <Input name="description" defaultValue={template.description ?? ''} />
                <div className="flex gap-2">
                  <Button size="sm" type="submit">
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" type="button" onClick={() => setEditing(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <article key={template.id} className="rounded-xl border bg-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {template.category ?? 'General'}
                    </p>
                    <h2 className="text-base font-medium">{template.name}</h2>
                  </div>
                  {!template.is_active && <Badge>Archived</Badge>}
                </div>
                <p className="mt-2 min-h-10 text-sm text-muted-foreground">
                  {template.description || 'No description'}
                </p>
                {canEdit && template.is_active && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing(template.id)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () =>
                        setError((await duplicateTemplateAction(template.id)).error)
                      }
                    >
                      Duplicate
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () =>
                        setError((await archiveTemplateAction(template.id)).error)
                      }
                    >
                      Archive
                    </Button>
                  </div>
                )}
              </article>
            )
          )}
        </div>
      )}
      {!canEdit && (
        <p className="text-sm text-muted-foreground">
          Only owners and admins can manage templates.
        </p>
      )}
    </div>
  )
}
