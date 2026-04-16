import { authRepository } from '@infrastructure/repositories/authRepository'
import { useAuthStore } from '@application/store/authStore'
import type { UserRole } from '@domain/models'

export async function loginWithGoogle(idToken: string, role: UserRole = 'STUDENT'): Promise<boolean> {
  const result = await authRepository.loginWithGoogle(idToken, role)
  if (result.user.is_active) {
    useAuthStore.getState().setSession(result.user, result.access_token)
  }
  return result.user.is_active
}
