import { Eye, EyeOff, ShieldCheck, WifiOff } from 'lucide-react'
import { type FormEvent, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'

import { getApiErrorMessage } from '@/api'
import { useNetworkStatus } from '@/hooks/use-network-status'

import { useFieldWorkerLogin } from '../hooks'
import { useAuthStore } from '../stores/auth.store'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function LoginView() {
  const status = useAuthStore((state) => state.status)
  const notice = useAuthStore((state) => state.notice)
  const consumeNotice = useAuthStore((state) => state.consumeNotice)
  const loginMutation = useFieldWorkerLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const isOnline = useNetworkStatus()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [sessionMessage, setSessionMessage] = useState('')
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (notice !== 'expired') return
    setSessionMessage('Your session has expired. Sign in again to continue.')
    consumeNotice()
  }, [consumeNotice, notice])

  if (status === 'authenticated') return <Navigate replace to="/" />

  const requestError = loginMutation.isError
    ? getApiErrorMessage(loginMutation.error, 'Unable to sign in. Check your connection and try again.')
    : ''
  const error = validationError || requestError || sessionMessage

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSessionMessage('')
    if (!isOnline) {
      setValidationError('Connect to the internet to sign in.')
      return
    }
    const normalizedEmail = email.trim().toLowerCase()
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setValidationError('Enter a valid email address.')
      emailRef.current?.focus()
      return
    }
    if (!password) {
      setValidationError('Enter your password.')
      passwordRef.current?.focus()
      return
    }
    loginMutation.mutate({ email: normalizedEmail, password }, {
      onSuccess: () => {
        const requested = (location.state as { from?: string } | null)?.from
        const destination = requested?.startsWith('/') && !requested.startsWith('//') && requested !== '/login' ? requested : '/'
        navigate(destination, { replace: true })
      },
    })
  }

  function clearError() {
    setValidationError('')
    setSessionMessage('')
    loginMutation.reset()
  }

  return (
    <main className="app-frame flex min-h-dvh flex-col bg-white px-6 pb-8 pt-14">
      <div className="mb-10 flex flex-col items-center text-center">
        <img src="/logo.svg" alt="PLASCHEMA" className="mb-3 h-16 w-16" />
        <h1 className="text-2xl font-bold tracking-tight">PLASCHEMA</h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-[.18em] text-neutral-500">Field Worker Login</p>
        <p className="mt-3 max-w-64 text-sm text-neutral-500">Sign in to open your enrollment workspace.</p>
      </div>

      {!isOnline && <div className="mb-5 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800"><WifiOff aria-hidden="true" size={16} /><span>Connect to the internet to sign in. A valid saved session can still open offline.</span></div>}
      {error && <div aria-live="polite" role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">{error}</div>}

      <form className="flex flex-col gap-4" onSubmit={submit} noValidate>
        <label className="text-sm font-bold" htmlFor="field-worker-email">Email</label>
        <input ref={emailRef} id="field-worker-email" aria-invalid={Boolean(validationError)} className="field -mt-2" type="email" autoComplete="email" inputMode="email" placeholder="name@example.com" value={email} onChange={(event) => { setEmail(event.target.value); clearError() }} />
        <label className="text-sm font-bold" htmlFor="field-worker-password">Password</label>
        <span className="relative -mt-2">
          <input ref={passwordRef} id="field-worker-password" aria-invalid={validationError === 'Enter your password.'} className="field pr-12" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => { setPassword(event.target.value); clearError() }} />
          <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 min-h-11 min-w-11 -translate-y-1/2 p-2 text-neutral-500" onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff aria-hidden="true" size={19} /> : <Eye aria-hidden="true" size={19} />}</button>
        </span>
        <button className="primary-button mt-3 flex items-center justify-center gap-2" disabled={!isOnline || loginMutation.isPending} type="submit">{loginMutation.isPending ? 'Signing in…' : 'Sign in'}</button>
      </form>

      <p className="mt-auto flex items-center justify-center gap-1.5 pt-10 text-center text-xs text-neutral-400"><ShieldCheck aria-hidden="true" size={14} />Use your active field-worker account.</p>
    </main>
  )
}
