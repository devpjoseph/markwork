export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface User {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
}
