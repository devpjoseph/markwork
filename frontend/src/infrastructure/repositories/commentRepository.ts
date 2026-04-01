import { apiClient } from '@infrastructure/api/client'
import type { Comment, CommentStatus } from '@domain/models'

export interface CreateCommentPayload {
  tiptap_node_id: string
  selected_text: string
  content: string
  parent_id?: string
}

export const commentRepository = {
  async listByAssignment(assignmentId: string): Promise<Comment[]> {
    const { data } = await apiClient.get<Comment[]>(`/assignments/${assignmentId}/comments`)
    return data
  },

  async create(assignmentId: string, payload: CreateCommentPayload): Promise<Comment> {
    const { data } = await apiClient.post<Comment>(
      `/assignments/${assignmentId}/comments`,
      payload,
    )
    return data
  },

  async updateStatus(commentId: string, status: CommentStatus): Promise<Comment> {
    const { data } = await apiClient.patch<Comment>(`/comments/${commentId}`, { status })
    return data
  },

  async updateContent(commentId: string, content: string): Promise<Comment> {
    const { data } = await apiClient.patch<Comment>(`/comments/${commentId}`, { content })
    return data
  },

  async delete(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`)
  },
}
