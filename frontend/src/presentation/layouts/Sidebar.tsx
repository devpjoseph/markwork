import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@application/store/authStore'
import { useTheme } from '@application/theme/useTheme'

interface NavItemProps {
  to: string
  label: string
  icon?: string
  end?: boolean
}

function NavItem({ to, label, icon, end }: NavItemProps) {
  const colors = useTheme()

  return (
    <NavLink
      to={to}
      end={end}
      style={({ isActive }) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.75rem',
        borderRadius: '0.5rem',
        textDecoration: 'none',
        fontSize: '0.875rem',
        fontWeight: isActive ? 600 : 400,
        color: isActive ? colors.primary : colors.text,
        background: isActive ? colors.primaryLight : 'transparent',
        transition: 'background 0.1s, color 0.1s',
        fontFamily: "'Geist', 'Inter', sans-serif",
      })}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        if (!el.getAttribute('aria-current')) {
          el.style.background = colors.surfaceHover
        }
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        if (!el.getAttribute('aria-current')) {
          el.style.background = 'transparent'
        }
      }}
    >
      {icon && <span style={{ fontSize: '1rem', lineHeight: 1 }}>{icon}</span>}
      {label}
    </NavLink>
  )
}

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const colors = useTheme()
  const role = user?.role

  return (
    <nav
      style={{
        width: '220px',
        minWidth: '220px',
        background: colors.background,
        borderRight: `1px solid ${colors.border}`,
        padding: '1.25rem 0.75rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.25rem',
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
    >
      {/* Section label */}
      <p
        style={{
          fontSize: '0.6875rem',
          fontWeight: 600,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          margin: '0 0 0.375rem 0.75rem',
        }}
      >
        Navigation
      </p>

      <NavItem to="/" label="Dashboard" icon="⊞" end />

      {role === 'STUDENT' && (
        <>
          <div
            style={{
              height: '1px',
              background: colors.border,
              margin: '0.75rem 0',
            }}
          />
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              margin: '0 0 0.375rem 0.75rem',
            }}
          >
            My Work
          </p>
          <NavItem to="/" label="All Assignments" icon="📄" end />
        </>
      )}

      {role === 'TEACHER' && (
        <>
          <div
            style={{
              height: '1px',
              background: colors.border,
              margin: '0.75rem 0',
            }}
          />
          <p
            style={{
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              margin: '0 0 0.375rem 0.75rem',
            }}
          >
            Review Queue
          </p>
          <NavItem to="/" label="Inbox" icon="📥" end />
        </>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* User section at bottom */}
      {user && (
        <div
          style={{
            borderTop: `1px solid ${colors.border}`,
            paddingTop: '0.75rem',
            marginTop: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.5rem',
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '9999px',
                background: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <span style={{ color: '#fff', fontSize: '0.6875rem', fontWeight: 700 }}>
                {user.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: colors.text,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user.full_name}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: '0.6875rem',
                  color: colors.textMuted,
                }}
              >
                {role === 'TEACHER' ? 'Teacher' : 'Student'}
              </p>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
