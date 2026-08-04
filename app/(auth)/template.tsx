// See app/dashboard/template.tsx for why this lives in a template, not the
// shared (auth) layout: a template re-mounts (and so re-animates) on every
// navigation, while a layout persists -- the background/panel chrome in
// app/(auth)/layout.tsx should stay put, only the form content should
// transition between /login, /forgot-password, and /reset-password.
export default function AuthTemplate({ children }: { children: React.ReactNode }) {
  return <div className="page-transition-in">{children}</div>
}
