import { apiClient } from '@infrastructure/api/client'
import type { User } from '@domain/models'

export const userRepository = {
  async getMe(): Promise<User> {
    const { data } = await apiClient.get<User>('/users/me')
    return data
  },

  async listTeachers(): Promise<User[]> {
    const { data } = await apiClient.get<User[]>('/users/teachers')
    return data
  },
}
