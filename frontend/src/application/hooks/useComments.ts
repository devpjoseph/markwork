import { useCallback, useEffect, useState } from 'react'
import { commentRepository, type CreateCommentPayload } from '@infrastructure/repositories/commentRepository'
import { useAssignmentStore } from '@application/store/assignmentStore'
import type { CommentStatus } from '@domain/models'

export function useComments(assignmentId: string) {
  const { currentComments, setComments, addComment, updateComment, removeComment } = useAssignmentStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchComments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const comments = await commentRepository.listByAssignment(assignmentId)
      setComments(comments)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId, setComments])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  const createComment = useCallback(
    async (payload: CreateCommentPayload) => {
      const comment = await commentRepository.create(assignmentId, payload)
      addComment(comment)
      return comment
    },
    [assignmentId, addComment],
  )

  const changeCommentStatus = useCallback(
    async (commentId: string, status: CommentStatus) => {
      const updated = await commentRepository.updateStatus(commentId, status)
      updateComment(updated)
      return updated
    },
    [updateComment],
  )

  const editCommentContent = useCallback(
    async (commentId: string, content: string) => {
      const updated = await commentRepository.updateContent(commentId, content)
      updateComment(updated)
      return updated
    },
    [updateComment],
  )

  const deleteComment = useCallback(
    async (commentId: string) => {
      await commentRepository.delete(commentId)
      removeComment(commentId)
    },
    [removeComment],
  )

  return {
    comments: currentComments,
    isLoading,
    error,
    addComment,
    createComment,
    changeCommentStatus,
    editCommentContent,
    deleteComment,
    refetch: fetchComments,
  }
}
