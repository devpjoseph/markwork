import { apiClient } from '@infrastructure/api/client'
import type { User, UserRole } from '@domain/models'

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export const authRepository = {
  async loginWithGoogle(idToken: string, role: UserRole = 'STUDENT'): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/google', {
      id_token: idToken,
      role,
    })
    return data
  },
}
