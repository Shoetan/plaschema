import { Eye, EyeOff, ShieldCheck, WifiOff } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { useNetworkStatus } from '@/hooks/use-network-status'
import { useAppStore } from '@/stores/app-store'

export function LoginView() {
  const user = useAppStore((state) => state.user)
  const signIn = useAppStore((state) => state.signIn)
  const navigate = useNavigate()
  const location = useLocation()
  const isOnline = useNetworkStatus()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (user) return <Navigate replace to="/" />

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Enter your email and password.')
      return
    }
    setLoading(true)
    window.setTimeout(() => {
      signIn(email.trim())
      const from = (location.state as { from?: string } | null)?.from ?? '/'
      navigate(from, { replace: true })
    }, 500)
  }

  return (
    <main className="app-frame flex min-h-dvh flex-col bg-white px-6 pb-8 pt-14">
      <div className="mb-10 flex flex-col items-center text-center">
        <img src="/logo.svg" alt="PLASCHEMA" className="mb-3 h-16 w-16" />
        <h1 className="text-2xl font-bold tracking-tight">PLASCHEMA</h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-[.18em] text-neutral-500">Field Worker Login</p>
        <p className="mt-3 max-w-64 text-sm text-neutral-500">Sign in to open your enrollment workspace.</p>
      </div>

      {!isOnline && <div className="mb-5 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800"><WifiOff size={16} />Demo mode still works offline.</div>}
      {error && <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}

      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <label className="flex flex-col gap-1.5 text-sm font-bold">Email
          <input className="field" type="email" autoComplete="email" placeholder="name@example.com" value={email} onChange={(event) => { setEmail(event.target.value); setError('') }} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-bold">Password
          <span className="relative">
            <input className="field pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter any password" value={password} onChange={(event) => { setPassword(event.target.value); setError('') }} />
            <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-neutral-500" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={19} /> : <Eye size={19} />}</button>
          </span>
        </label>
        <button className="primary-button mt-3 flex items-center justify-center gap-2" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</button>
      </form>

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-10 text-center text-xs text-neutral-400"><ShieldCheck size={14} />Design demo. No details are sent anywhere.</p>
    </main>
  )
}
