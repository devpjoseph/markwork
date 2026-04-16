import { useCallback, useEffect, useState } from 'react'
import { adminRepository } from '@infrastructure/repositories/adminRepository'
import type { User, UserRole } from '@domain/models'

export interface AdminUsersFilters {
  role?: UserRole
  isActive?: boolean
  search: string
}

const DEFAULT_FILTERS: AdminUsersFilters = {
  role: undefined,
  isActive: undefined,
  search: '',
}

export function useAdminUsers(initialSize = 20) {
  const [users, setUsers] = useState<User[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [page, setPage] = useState(1)
  const [size] = useState(initialSize)
  const [filters, setFilters] = useState<AdminUsersFilters>(DEFAULT_FILTERS)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await adminRepository.listUsers({
        role: filters.role,
        isActive: filters.isActive,
        search: filters.search || undefined,
        page,
        size,
      })
      setUsers(result.items)
      setTotal(result.total)
      setPages(result.pages || 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [filters.role, filters.isActive, filters.search, page, size])

  useEffect(() => {
    refresh()
  }, [refresh])

  const toggleActivation = useCallback(async (user: User) => {
    try {
      const updated = await adminRepository.setActivation(user.id, !user.is_active)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update activation')
      throw err
    }
  }, [])

  const changeRole = useCallback(async (user: User, role: UserRole) => {
    if (user.role === role) return
    try {
      const updated = await adminRepository.setRole(user.id, role)
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
      throw err
    }
  }, [])

  const removeUser = useCallback(async (user: User) => {
    try {
      await adminRepository.deleteUser(user.id)
      setUsers((prev) => prev.filter((u) => u.id !== user.id))
      setTotal((prev) => prev - 1)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user')
      throw err
    }
  }, [])

  const updateFilters = useCallback((patch: Partial<AdminUsersFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }))
    setPage(1)
  }, [])

  return {
    users,
    total,
    page,
    pages,
    size,
    filters,
    isLoading,
    error,
    setPage,
    setFilters: updateFilters,
    refresh,
    toggleActivation,
    changeRole,
    removeUser,
  }
}

