import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteUser, listUsers } from '../api/users.api'

export const usersKey = ['users'] as const

export function useUsers() {
  return useQuery({
    queryKey: usersKey,
    queryFn: listUsers,
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: usersKey }),
  })
}
