import { useCallback, useEffect, useState } from 'react'
import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'
import { useAssignmentStore } from '@application/store/assignmentStore'
import type { Assignment } from '@domain/models'

export function useAssignments() {
  const { assignments, setAssignments } = useAssignmentStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchAssignments = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await assignmentRepository.list()
      setAssignments(result.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assignments')
    } finally {
      setIsLoading(false)
    }
  }, [setAssignments])

  useEffect(() => {
    fetchAssignments()
  }, [fetchAssignments])

  return { assignments, isLoading, error, refetch: fetchAssignments }
}
