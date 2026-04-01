import { assignmentRepository } from '@infrastructure/repositories/assignmentRepository'
import { useAssignmentStore } from '@application/store/assignmentStore'

export async function submitAssignment(assignmentId: string): Promise<void> {
  const updated = await assignmentRepository.submit(assignmentId)
  useAssignmentStore.getState().updateAssignment(updated)
}
