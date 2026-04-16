import { useAssignments } from '@application/hooks/useAssignments'
import { useAuthStore } from '@application/store/authStore'
import TeacherDashboard from './TeacherDashboard'
import StudentDashboard from './StudentDashboard'
import AdminDashboard from './AdminDashboard'

function StudentOrTeacherDashboard({ isTeacher }: { isTeacher: boolean }) {
  const { assignments, isLoading, error, refetch } = useAssignments()
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

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)

  if (user?.role === 'ADMIN') {
    return <AdminDashboard />
  }

  return <StudentOrTeacherDashboard isTeacher={user?.role === 'TEACHER'} />
}
