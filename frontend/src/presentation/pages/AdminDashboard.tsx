import { useNavigate } from 'react-router-dom'
import { useTheme } from '@application/theme/useTheme'
import { useAuthStore } from '@application/store/authStore'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const colors = useTheme()
  const user = useAuthStore((s) => s.user)

  return (
    <div style={{ fontFamily: "'Geist', 'Inter', sans-serif", width: '100%' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <p
          style={{
            margin: '0 0 0.5rem',
            fontSize: '0.75rem',
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: colors.primary,
          }}
        >
          Admin Console
        </p>
        <h1
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '2rem',
            fontWeight: 700,
            color: colors.text,
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Welcome{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p
          style={{
            margin: '0.5rem 0 0',
            color: colors.textMuted,
            fontSize: '0.9375rem',
          }}
        >
          Manage platform users, their roles, and access.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1rem',
        }}
      >
        <button
          onClick={() => navigate('/admin/users')}
          style={{
            textAlign: 'left',
            background: colors.surface,
            borderRadius: '0.75rem',
            border: `1px solid ${colors.border}`,
            padding: '1.5rem',
            cursor: 'pointer',
            fontFamily: 'inherit',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '0.5rem',
              background: colors.primaryLight,
              color: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '1.125rem',
              fontWeight: 600,
              color: colors.text,
              fontFamily: "'Newsreader', Georgia, serif",
            }}
          >
            User management
          </h3>
          <p style={{ margin: 0, color: colors.textMuted, fontSize: '0.875rem', lineHeight: 1.5 }}>
            Activate pending accounts, change roles, and review the user base.
          </p>
          <span style={{ fontSize: '0.8125rem', color: colors.primary, fontWeight: 600, marginTop: '0.25rem' }}>
            Open users &rarr;
          </span>
        </button>
      </div>
    </div>
  )
}
