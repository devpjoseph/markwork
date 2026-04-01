import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@application/store/authStore'
import { useTheme } from '@application/theme/useTheme'
import StatusBadge from './StatusBadge'
import type { Assignment } from '@domain/models'

interface Props {
  assignment: Assignment
}

export default function AssignmentCard({ assignment }: Props) {
  const navigate = useNavigate()
  const role = useAuthStore((s) => s.user?.role)
  const colors = useTheme()

  const handleClick = () => {
    if (role === 'TEACHER') {
      navigate(`/assignments/${assignment.id}/review`)
    } else {
      navigate(`/assignments/${assignment.id}/edit`)
    }
  }

  return (
    <div
      onClick={handleClick}
      style={{ border: `1px solid ${colors.border}`, borderRadius: '8px', padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: colors.surface }}
    >
      <div>
        <p style={{ fontWeight: 600, margin: 0, color: colors.text }}>{assignment.title}</p>
        <p style={{ fontSize: '0.75rem', color: colors.textMuted, margin: '0.25rem 0 0' }}>
          {new Date(assignment.updated_at).toLocaleDateString()}
        </p>
      </div>
      <StatusBadge status={assignment.status} />
    </div>
  )
}
