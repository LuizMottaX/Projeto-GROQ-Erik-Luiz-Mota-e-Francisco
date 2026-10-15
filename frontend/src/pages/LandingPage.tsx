import { Link } from 'react-router-dom'
import { Logo, MicIcon } from '../components/Logo'
import { selectIsAuthenticated, useAuthStore } from '../stores/auth.store'

const features = [
  {
    title: 'Envie o áudio',
    text: 'MP3, WAV, M4A, OGG, WEBM e outros formatos, com até 25 MB.',
  },
  {
    title: 'Receba o texto',
    text: 'Transcrição rápida com o modelo Whisper, rodando na Groq.',
  },
  {
    title: 'Consulte depois',
    text: 'Tudo fica salvo no seu histórico pessoal, visível só para você.',
  },
]

const primaryCta =
  'inline-flex items-center justify-center rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700'
const secondaryCta =
  'inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50'

export function LandingPage() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated)

  return (
    <div className="min-h-svh bg-gradient-to-b from-brand-50 to-slate-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5">
        <Logo />
        {isAuthenticated ? (
          <Link to="/app" className={secondaryCta}>
            Ir para o app
          </Link>
        ) : (
          <Link to="/entrar" className="text-sm font-medium text-slate-700 hover:text-brand-700">
            Entrar
          </Link>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-4">
        <section className="py-16 text-center sm:py-24">
          <span className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-200">
            <MicIcon className="size-8" />
          </span>
          <h1 className="mx-auto max-w-2xl text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Transforme áudio em texto em segundos
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-600">
            O Ditado transcreve gravações, reuniões e anotações de voz e guarda tudo
            num histórico organizado.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Link to="/app" className={primaryCta}>
                Nova transcrição
              </Link>
            ) : (
              <>
                <Link to="/entrar?modo=cadastro" className={primaryCta}>
                  Criar conta grátis
                </Link>
                <Link to="/entrar" className={secondaryCta}>
                  Já tenho conta
                </Link>
              </>
            )}
          </div>
        </section>

        <section className="grid gap-4 pb-24 sm:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs"
            >
              <span className="mb-3 grid size-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                {index + 1}
              </span>
              <h2 className="font-semibold text-slate-900">{feature.title}</h2>
              <p className="mt-1 text-sm text-slate-600">{feature.text}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
        Ditado · Transcrição de áudio com Groq Whisper
      </footer>
    </div>
  )
}
