import { authRepository } from '@infrastructure/repositories/authRepository'
import { useAuthStore } from '@application/store/authStore'
import type { UserRole } from '@domain/models'

export async function loginWithGoogle(idToken: string, role: UserRole = 'STUDENT'): Promise<void> {
  const result = await authRepository.loginWithGoogle(idToken, role)
  useAuthStore.getState().setSession(result.user, result.access_token)
}
