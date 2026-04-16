import { useNavigate } from 'react-router-dom'
import { useTheme } from '@application/theme/useTheme'

export default function PendingApprovalPage() {
  const navigate = useNavigate()
  const colors = useTheme()

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
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '0 1.5rem',
          textAlign: 'center',
        }}
      >
        {/* Success icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: colors.successBg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '1.75rem',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.success}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "'Newsreader', Georgia, serif",
            fontSize: '2.5rem',
            fontWeight: 700,
            color: colors.text,
            margin: '0 0 1rem',
            letterSpacing: '-0.02em',
            lineHeight: 1.15,
          }}
        >
          Registration Successful
        </h1>

        {/* Description */}
        <p
          style={{
            fontSize: '1rem',
            lineHeight: 1.65,
            color: colors.textSecondary,
            margin: '0 0 2.5rem',
            maxWidth: '400px',
          }}
        >
          Your account has been successfully registered. An administrator will
          review and approve your account shortly. Once approved, you'll be
          able to sign in.
        </p>

        {/* Go to Login button */}
        <button
          onClick={() => navigate('/login', { replace: true })}
          style={{
            padding: '0.75rem 2rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: colors.buttonDark,
            color: colors.buttonDarkText,
            fontSize: '0.875rem',
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            letterSpacing: '0.01em',
            transition: 'opacity 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.opacity = '0.85'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.opacity = '1'
          }}
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}
