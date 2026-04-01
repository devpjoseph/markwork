import { useAssignments } from '@application/hooks/useAssignments'
import { useAuthStore } from '@application/store/authStore'
import TeacherDashboard from './TeacherDashboard'
import StudentDashboard from './StudentDashboard'

export default function DashboardPage() {
  const { assignments, isLoading, error, refetch } = useAssignments()
  const user = useAuthStore((s) => s.user)
  const isTeacher = user?.role === 'TEACHER'

  if (isTeacher) {
    return (
      <TeacherDashboard
        assignments={assignments}
        isLoading={isLoading}
        error={error}
        refetch={refetch}
      />
    )
  }

  return (
    <StudentDashboard
      assignments={assignments}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  )
}
