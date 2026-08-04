// A template re-mounts its children on every navigation (unlike layout.tsx),
// so this re-triggers the page-transition-in animation per route change.
// Deliberately placed here, below DashboardShell in app/dashboard/layout.tsx,
// not at the app root -- a root-level template would remount the sidebar and
// topbar too, resetting BreadcrumbProvider's state and flashing the chrome
// on every click. Only the page content itself should animate.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition-in">{children}</div>
}
