import { useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { TextField } from '../components/ui/TextField'
import { useLogin, useRegister } from '../hooks/useAuth'
import { getErrorMessage } from '../lib/api'

type Mode = 'login' | 'cadastro'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function EntrarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const mode: Mode = searchParams.get('modo') === 'cadastro' ? 'cadastro' : 'login'

  function switchMode(next: Mode) {
    setSearchParams(next === 'cadastro' ? { modo: 'cadastro' } : {}, { replace: true })
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-brand-50 to-slate-50 px-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div role="tablist" className="mb-6 grid grid-cols-2 rounded-lg bg-slate-100 p-1">
          {(['login', 'cadastro'] as const).map((tab) => (
            <button
              key={tab}
              role="tab"
              type="button"
              aria-selected={mode === tab}
              onClick={() => switchMode(tab)}
              className={`rounded-md py-2 text-sm font-medium transition-colors ${
                mode === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {tab === 'login' ? 'Entrar' : 'Criar conta'}
            </button>
          ))}
        </div>

        {mode === 'login' ? <LoginForm key="login" /> : <RegisterForm key="cadastro" />}
      </div>
    </div>
  )
}

function LoginForm() {
  const login = useLogin()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    login.mutate({ email: email.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />
      {login.isError && <Alert>{getErrorMessage(login.error)}</Alert>}
      <Button
        type="submit"
        className="w-full"
        loading={login.isPending}
        disabled={!email || !password}
      >
        Entrar
      </Button>
    </form>
  )
}

interface RegisterErrors {
  name?: string
  email?: string
  password?: string
}

function validateRegister(name: string, email: string, password: string): RegisterErrors {
  const errors: RegisterErrors = {}
  if (!name.trim()) errors.name = 'Informe seu nome'
  if (!EMAIL_PATTERN.test(email.trim())) errors.email = 'Informe um e-mail válido'
  if (password.length < 8) errors.password = 'A senha precisa ter ao menos 8 caracteres'
  if (password.length > 72) errors.password = 'A senha pode ter no máximo 72 caracteres'
  return errors
}

function RegisterForm() {
  const registerUser = useRegister()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const errors = submitted ? validateRegister(name, email, password) : {}

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateRegister(name, email, password)).length > 0) return
    registerUser.mutate({ name: name.trim(), email: email.trim(), password })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <TextField
        label="Nome"
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={errors.name}
        maxLength={120}
      />
      <TextField
        label="E-mail"
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
      />
      <TextField
        label="Senha"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo de 8 caracteres"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
      />
      {registerUser.isError && <Alert>{getErrorMessage(registerUser.error)}</Alert>}
      <Button type="submit" className="w-full" loading={registerUser.isPending}>
        Criar conta
      </Button>
    </form>
  )
}
