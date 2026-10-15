import { Alert } from '../components/ui/Alert'
import { Button } from '../components/ui/Button'
import { ConfirmButton } from '../components/ui/ConfirmButton'
import { useDeleteUser, useUsers } from '../hooks/useUsers'
import { getErrorMessage } from '../lib/api'
import { formatDateTime } from '../lib/format'
import { useAuthStore } from '../stores/auth.store'
import type { User } from '../types/api'

export function AdminPage() {
  const { data, isPending, isError, error, refetch } = useUsers()
  const remove = useDeleteUser()

  return (
    <section>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Usuários</h1>
        <p className="mt-1 text-sm text-slate-600">
          Excluir uma conta remove também todas as transcrições dela.
        </p>
      </div>

      {remove.isError && (
        <div className="mb-4">
          <Alert>{getErrorMessage(remove.error, 'Não foi possível excluir.')}</Alert>
        </div>
      )}

      {isPending && (
        <div className="h-48 animate-pulse rounded-2xl bg-slate-200/60" aria-busy="true" />
      )}

      {isError && (
        <div className="space-y-3">
          <Alert>{getErrorMessage(error, 'Não foi possível carregar os usuários.')}</Alert>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Nome</th>
                <th className="px-4 py-3 font-medium">E-mail</th>
                <th className="px-4 py-3 font-medium">Perfil</th>
                <th className="px-4 py-3 font-medium">Criado em</th>
                <th className="px-4 py-3" aria-label="Ações" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onDelete={() => remove.mutate(user.id)}
                  deleting={remove.isPending && remove.variables === user.id}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function UserRow({
  user,
  onDelete,
  deleting,
}: {
  user: User
  onDelete: () => void
  deleting: boolean
}) {
  const currentUserId = useAuthStore((s) => s.user?.id)
  const isSelf = user.id === currentUserId

  return (
    <tr>
      <td className="px-4 py-3 font-medium text-slate-900">
        {user.name}
        {isSelf && <span className="ml-2 text-xs font-normal text-slate-500">(você)</span>}
      </td>
      <td className="px-4 py-3 text-slate-600">{user.email}</td>
      <td className="px-4 py-3">
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
            user.role === 'admin' ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {user.role === 'admin' ? 'Admin' : 'Usuário'}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3 text-slate-600">
        {formatDateTime(user.createdAt)}
      </td>
      <td className="px-4 py-3 text-right">
        {!isSelf && (
          <ConfirmButton onConfirm={onDelete} loading={deleting} confirmLabel="Excluir conta">
            Excluir
          </ConfirmButton>
        )}
      </td>
    </tr>
  )
}
