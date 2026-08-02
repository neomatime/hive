import Link from 'next/link'
import { FileText, FolderKanban, ListTodo, UserRound } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getCurrentUserWithMembership } from '@/services/workspace/workspace-service'
import { globalSearch } from '@/services/search/search-service'
const sections = [
  {
    key: 'projects',
    title: 'Projects',
    icon: FolderKanban,
    href: (item: { id: string }) => `/dashboard/projects/${item.id}`,
  },
  {
    key: 'tasks',
    title: 'Tasks',
    icon: ListTodo,
    href: (item: { project_id: string }) => `/dashboard/projects/${item.project_id}/board`,
  },
  {
    key: 'files',
    title: 'Files',
    icon: FileText,
    href: (item: { project_id: string }) => `/dashboard/projects/${item.project_id}/files`,
  },
  { key: 'people', title: 'Team', icon: UserRound, href: () => '/dashboard/settings/team' },
] as const
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const query = (await searchParams).q?.trim() ?? '',
    client = await createClient(),
    current = await getCurrentUserWithMembership(client)
  if (current.status !== 'ok') return null
  const results = await globalSearch(client, current.user.workspace.id, query)
  const total = Object.values(results).reduce((count, items) => count + items.length, 0)
  return (
    <div className="space-y-6">
      <div>
        <h1>Search</h1>
        <p className="text-muted-foreground">
          {query.length < 2
            ? 'Enter at least two characters in the search bar.'
            : `${total} result${total === 1 ? '' : 's'} for “${query}”`}
        </p>
      </div>
      {query.length >= 2 && total === 0 ? (
        <div className="rounded-xl border border-dashed p-10 text-center">
          <h2>No results found</h2>
          <p className="text-sm text-muted-foreground">Try a broader term or check the spelling.</p>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {sections.map(({ key, title, icon: Icon, href }) => {
            const items = results[key]
            if (!items.length) return null
            return (
              <section key={key} className="rounded-xl border bg-card p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Icon className="size-4 text-primary" />
                  <h2 className="text-base font-medium">{title}</h2>
                  <span className="text-xs text-muted-foreground">{items.length}</span>
                </div>
                <div className="divide-y">
                  {items.map((item) => (
                    <Link
                      key={item.id}
                      href={href(item as never)}
                      className="block py-3 hover:text-primary"
                    >
                      <p className="text-sm font-medium">
                        {'name' in item
                          ? item.name
                          : 'title' in item
                            ? item.title
                            : item.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {'project_code' in item
                          ? item.project_code
                          : 'email' in item
                            ? item.email
                            : 'priority' in item
                              ? `${item.priority} priority`
                              : item.mime_type}
                      </p>
                    </Link>
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
