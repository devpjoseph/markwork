import axios, { AxiosError } from 'axios'
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@domain/errors/AppError'
import { useAuthStore } from '@application/store/authStore'

export const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || '') + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request (reads from Zustand store — single source of truth)
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Map of safe, user-facing messages per status code
const safeMessages: Record<number, string> = {
  401: 'Your session has expired. Please log in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'This action conflicts with the current state. Please refresh and try again.',
  500: 'An unexpected error occurred. Please try again later.',
}

// Normalize API errors into domain errors with safe messages
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const status = error.response?.status
    const message = safeMessages[status ?? 0] ?? 'Something went wrong. Please try again.'

    if (status === 401) throw new UnauthorizedError(message)
    if (status === 403) throw new ForbiddenError(message)
    if (status === 404) throw new NotFoundError(message)
    if (status === 409) throw new ConflictError(message)

    throw new AppError(message, status)
  },
)
