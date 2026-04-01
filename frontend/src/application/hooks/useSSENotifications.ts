import { useEffect } from 'react'
import { sseClient, type SSEPayload } from '@infrastructure/sse/sseClient'
import { useAuthStore } from '@application/store/authStore'
import { useAssignmentStore } from '@application/store/assignmentStore'
import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'

export function useSSENotifications() {
  const { token, isAuthenticated } = useAuthStore()
  const { updateAssignment } = useAssignmentStore()

  useEffect(() => {
    if (!isAuthenticated || !token) return

    sseClient.connect(token)

    const unsubscribe = sseClient.on(async (payload: SSEPayload) => {
      if (
        payload.type === 'assignment.submitted' ||
        payload.type === 'assignment.status_changed'
      ) {
        const assignmentId = payload.data.assignment_id
        if (assignmentId) {
          try {
            const updated = await assignmentRepository.getById(assignmentId)
            updateAssignment(updated)
          } catch {
            // assignment may not be in local list yet — ignore
          }
        }
      }
    })

    return () => {
      unsubscribe()
      sseClient.disconnect()
    }
  }, [isAuthenticated, token, updateAssignment])
}
