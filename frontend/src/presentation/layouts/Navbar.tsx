import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@application/store/authStore'
import { useTheme } from '@application/theme/useTheme'
import { useThemeStore } from '@application/theme/themeStore'

export default function Navbar() {
  const navigate = useNavigate()
  const { user, clearSession } = useAuthStore()
  const colors = useTheme()
  const toggleTheme = useThemeStore((s) => s.toggle)
  const themeMode = useThemeStore((s) => s.mode)

  function handleLogout() {
    clearSession()
    navigate('/login', { replace: true })
  }

  return (
    <header
      style={{
        height: '56px',
        background: colors.background,
        position: 'sticky',
        top: 0,
        zIndex: 40,
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
    >
      <div
        className="navbar-inner"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          borderBottom: `1px solid ${colors.border}`,
        }}
      >
        {/* Brand */}
        <Link
          to="/"
          style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', textDecoration: 'none' }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: colors.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <span style={{ color: '#fff', fontSize: '0.9375rem', fontWeight: 700 }}>M</span>
          </div>
          <span
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 700,
              fontSize: '1.125rem',
              color: colors.logoAccent,
              letterSpacing: '-0.01em',
            }}
          >
            Markwork
          </span>
        </Link>

        {/* Right side */}
        <div className="navbar-right-group">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            title={themeMode === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '0.375rem',
              borderRadius: '0.375rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: colors.textMuted,
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
            onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
          >
            {themeMode === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
          </button>

          {user && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {/* Avatar */}
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '9999px',
                    background: colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ color: '#fff', fontSize: '0.75rem', fontWeight: 700 }}>
                    {user.full_name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase()}
                  </span>
                </div>
                <div className="navbar-user-info">
                  <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: colors.text }}>
                    {user.full_name}
                  </span>
                  <span style={{ fontSize: '0.6875rem', color: colors.textMuted }}>
                    {user.role === 'TEACHER' ? 'Teacher' : 'Student'}
                  </span>
                </div>
              </div>

              <div style={{ width: '1px', height: '20px', background: colors.border }} />

              {/* Sign out — desktop: text, mobile: icon */}
              <button
                onClick={handleLogout}
                style={{
                  fontSize: '0.8125rem',
                  color: colors.textMuted,
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.375rem',
                  fontFamily: 'inherit',
                  transition: 'color 0.15s',
                  display: 'flex',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = colors.primary)}
                onMouseLeave={(e) => (e.currentTarget.style.color = colors.textMuted)}
              >
                <span className="navbar-signout-text">Sign out</span>
                <span className="navbar-signout-icon" style={{ lineHeight: 1 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
