import { useCallback, useEffect, useState } from 'react'
import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'
import { useAssignmentStore } from '@application/store/assignmentStore'
import type { AssignmentVersion } from '@domain/models'

function extractPlainText(node: AssignmentVersion['content']): string {
  if (node.text) return node.text
  if (node.content) return node.content.map(extractPlainText).join('\n')
  return ''
}

export function useAssignmentDiff(assignmentId: string) {
  const { currentVersions, setVersions } = useAssignmentStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchVersions = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const versions = await assignmentRepository.getVersions(assignmentId)
      setVersions(versions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load versions')
    } finally {
      setIsLoading(false)
    }
  }, [assignmentId, setVersions])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  const getDiff = useCallback(
    (versionA: number, versionB: number) => {
      const a = currentVersions.find((v) => v.version_number === versionA)
      const b = currentVersions.find((v) => v.version_number === versionB)
      return {
        oldValue: a ? extractPlainText(a.content) : '',
        newValue: b ? extractPlainText(b.content) : '',
      }
    },
    [currentVersions],
  )

  return { versions: currentVersions, isLoading, error, getDiff }
}
