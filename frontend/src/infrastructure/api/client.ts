import axios, { AxiosError } from 'axios'
import {
  AppError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from '@domain/errors/AppError'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL + '/api/v1',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT on every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Normalize API errors into domain errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    const status = error.response?.status
    const detail = error.response?.data?.detail ?? error.message

    if (status === 401) throw new UnauthorizedError(detail)
    if (status === 403) throw new ForbiddenError(detail)
    if (status === 404) throw new NotFoundError(detail)
    if (status === 409) throw new ConflictError(detail)

    throw new AppError(detail, status)
  },
)
