'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOutAction } from '@/app/dashboard/actions'

export function UserMenu({
  displayName,
  email,
  avatarUrl,
}: {
  displayName: string
  email: string
  avatarUrl: string | null
}) {
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2" aria-label={displayName}>
        <Avatar>
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <span className="text-sm">{displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <div className="px-2 py-1.5 text-sm" style={{ color: 'var(--text-muted)' }}>
          {email}
        </div>
        <DropdownMenuItem onClick={() => signOutAction()}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
