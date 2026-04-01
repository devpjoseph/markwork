import { apiClient } from '@infrastructure/api/client'
import type { Assignment, AssignmentVersion, TipTapNode } from '@domain/models'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

export interface CreateAssignmentPayload {
  teacher_id: string
  title: string
  initial_content: TipTapNode
}

export interface UpdateAssignmentPayload {
  content: TipTapNode
  title?: string
}

export const assignmentRepository = {
  async list(page = 1, size = 20): Promise<PaginatedResponse<Assignment>> {
    const { data } = await apiClient.get<PaginatedResponse<Assignment>>('/assignments', {
      params: { page, size },
    })
    return data
  },

  async getById(id: string): Promise<Assignment> {
    const { data } = await apiClient.get<Assignment>(`/assignments/${id}`)
    return data
  },

  async create(payload: CreateAssignmentPayload): Promise<Assignment> {
    const { data } = await apiClient.post<Assignment>('/assignments', payload)
    return data
  },

  async update(id: string, payload: UpdateAssignmentPayload): Promise<Assignment> {
    const { data } = await apiClient.put<Assignment>(`/assignments/${id}`, payload)
    return data
  },

  async submit(id: string): Promise<Assignment> {
    const { data } = await apiClient.post<Assignment>(`/assignments/${id}/submit`)
    return data
  },

  async startReview(id: string): Promise<Assignment> {
    const { data } = await apiClient.post<Assignment>(`/assignments/${id}/review/start`)
    return data
  },

  async finalizeReview(id: string, decision: 'APPROVE' | 'REQUEST_CHANGES'): Promise<Assignment> {
    const { data } = await apiClient.post<Assignment>(`/assignments/${id}/review/finalize`, {
      decision,
    })
    return data
  },

  async getVersions(id: string): Promise<AssignmentVersion[]> {
    const { data } = await apiClient.get<AssignmentVersion[]>(`/assignments/${id}/versions`)
    return data
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/assignments/${id}`)
  },
}
