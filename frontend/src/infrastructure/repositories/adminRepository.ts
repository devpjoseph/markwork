import { apiClient } from '@infrastructure/api/client'
import type { User, UserRole } from '@domain/models'
import type { PaginatedResponse } from './assignmentRepository'

export interface ListUsersParams {
  role?: UserRole
  isActive?: boolean
  search?: string
  page?: number
  size?: number
}

export const adminRepository = {
  async listUsers(params: ListUsersParams = {}): Promise<PaginatedResponse<User>> {
    const query: Record<string, string | number | boolean> = {}
    if (params.role) query.role = params.role
    if (params.isActive !== undefined) query.is_active = params.isActive
    if (params.search && params.search.trim()) query.search = params.search.trim()
    query.page = params.page ?? 1
    query.size = params.size ?? 20
    const { data } = await apiClient.get<PaginatedResponse<User>>('/admin/users', { params: query })
    return data
  },

  async setActivation(id: string, isActive: boolean): Promise<User> {
    const { data } = await apiClient.patch<User>(`/admin/users/${id}/activation`, {
      is_active: isActive,
    })
    return data
  },

  async setRole(id: string, role: UserRole): Promise<User> {
    const { data } = await apiClient.patch<User>(`/admin/users/${id}/role`, { role })
    return data
  },

  async deleteUser(id: string): Promise<void> {
    await apiClient.delete(`/admin/users/${id}`)
  },
}
