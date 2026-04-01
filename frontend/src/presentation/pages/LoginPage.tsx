import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@application/store/authStore'
import { loginWithGoogle } from '@application/use_cases/loginWithGoogle'
import { waitForGoogleScript, initGoogleAuth, renderGoogleButton } from '@infrastructure/auth/googleAuth'
import { useTheme } from '@application/theme/useTheme'
import type { UserRole } from '@domain/models'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''

export default function LoginPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const buttonRef = useRef<HTMLDivElement>(null)
  const [selectedRole, setSelectedRole] = useState<UserRole>('STUDENT')
  const selectedRoleRef = useRef(selectedRole)
  selectedRoleRef.current = selectedRole
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const colors = useTheme()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    let cancelled = false

    waitForGoogleScript().then(() => {
      if (cancelled) return

      initGoogleAuth(GOOGLE_CLIENT_ID, async (idToken) => {
        setIsLoading(true)
        setError(null)
        try {
          await loginWithGoogle(idToken, selectedRoleRef.current)
          navigate('/', { replace: true })
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
        } finally {
          setIsLoading(false)
        }
      })

      if (buttonRef.current) {
        renderGoogleButton(buttonRef.current, buttonRef.current.offsetWidth)
      }
    }).catch(() => {
      if (!cancelled) {
        setError('Could not load Google Sign-In. Please refresh the page.')
      }
    })

    return () => { cancelled = true }
  }, [navigate])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: colors.loginBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Geist', 'Inter', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '408px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          padding: '0 1rem',
        }}
      >
        {/* Title */}
        <h1
          className="login-title"
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '3.5rem',
            fontWeight: 700,
            color: colors.text,
            margin: '0 0 2.5rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          Markwork
        </h1> <br /><br />

        {/* Role segmented control */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            borderRadius: '0.5rem',
            border: `1px solid ${colors.borderFocus}`,
            overflow: 'hidden',
            background: colors.loginSegmentBg,
            marginBottom: '2rem',
          }}
        >
          {(['STUDENT', 'TEACHER'] as UserRole[]).map((role) => (
            <button
              key={role}
              onClick={() => setSelectedRole(role)}
              style={{
                padding: '0.75rem',
                border: 'none',
                background: selectedRole === role ? colors.loginSegmentActive : 'transparent',
                color: selectedRole === role ? colors.text : colors.loginSegmentInactive,
                fontWeight: selectedRole === role ? 600 : 500,
                fontSize: '0.75rem',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {role === 'STUDENT' ? 'Student' : 'Teacher'}
            </button>
          ))}
        </div>

        {/* Google button */}
        {isLoading ? (
          <div
            style={{
              padding: '0.875rem 1.5rem',
              borderRadius: '0.5rem',
              border: `1px solid ${colors.borderFocus}`,
              background: colors.surface,
              textAlign: 'center',
              fontSize: '0.8125rem',
              color: colors.loginSegmentInactive,
            }}
          >
            Signing in…
          </div>
        ) : (
          <div ref={buttonRef} style={{ width: '100%' }} />
        )}

        {error && (
          <div
            style={{
              marginTop: '0.75rem',
              background: colors.errorBg,
              border: `1px solid ${colors.errorBorder}`,
              borderRadius: '0.5rem',
              padding: '0.75rem 1rem',
              color: colors.error,
              fontSize: '0.875rem',
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
