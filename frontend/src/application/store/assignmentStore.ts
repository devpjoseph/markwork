import { create } from 'zustand'
import type { Assignment, AssignmentVersion, Comment } from '@domain/models'

interface AssignmentState {
  assignments: Assignment[]
  currentAssignment: Assignment | null
  currentVersions: AssignmentVersion[]
  currentComments: Comment[]

  setAssignments: (assignments: Assignment[]) => void
  setCurrentAssignment: (assignment: Assignment | null) => void
  updateAssignment: (updated: Assignment) => void
  setVersions: (versions: AssignmentVersion[]) => void
  setComments: (comments: Comment[]) => void
  addComment: (comment: Comment) => void
  updateComment: (updated: Comment) => void
  removeComment: (commentId: string) => void
  removeAssignment: (assignmentId: string) => void
}

export const useAssignmentStore = create<AssignmentState>()((set) => ({
  assignments: [],
  currentAssignment: null,
  currentVersions: [],
  currentComments: [],

  setAssignments: (assignments) => set({ assignments }),

  setCurrentAssignment: (assignment) =>
    set({ currentAssignment: assignment, currentVersions: [], currentComments: [] }),

  updateAssignment: (updated) =>
    set((state) => ({
      assignments: state.assignments.map((a) => (a.id === updated.id ? updated : a)),
      currentAssignment:
        state.currentAssignment?.id === updated.id ? updated : state.currentAssignment,
    })),

  setVersions: (versions) => set({ currentVersions: versions }),

  setComments: (comments) => set({ currentComments: comments }),

  addComment: (comment) =>
    set((state) => ({ currentComments: [...state.currentComments, comment] })),

  updateComment: (updated) =>
    set((state) => ({
      currentComments: state.currentComments.map((c) => (c.id === updated.id ? updated : c)),
    })),

  removeComment: (commentId) =>
    set((state) => ({
      currentComments: state.currentComments.filter((c) => c.id !== commentId && c.parent_id !== commentId),
    })),

  removeAssignment: (assignmentId) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a.id !== assignmentId),
    })),
}))
