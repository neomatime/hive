'use client'

import { cn } from '@/lib/utils'

// Extracted from 4 call sites that each hand-rolled this same overlay+panel
// shell (task-detail-dialog, create-project-dialog, create-calendar-event,
// the team-member profile editor in settings-forms). closeOnOverlayClick and
// className default to what most of them already had; the two call sites
// that differ pass their own values explicitly (see the migration tasks).
export function Dialog({
  labelledBy,
  onClose,
  closeOnOverlayClick = true,
  className = 'w-full max-w-lg rounded-xl bg-background p-6 shadow-xl',
  children,
}: {
  labelledBy: string
  onClose: () => void
  closeOnOverlayClick?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
      onMouseDown={
        closeOnOverlayClick
          ? (event) => {
              if (event.target === event.currentTarget) onClose()
            }
          : undefined
      }
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(className)}
      >
        {children}
      </section>
    </div>
  )
}
