import { useState } from 'react'
import { useTheme } from '@application/theme/useTheme'
import { useAuthStore } from '@application/store/authStore'
import { useAdminUsers } from '@application/hooks/useAdminUsers'
import type { User, UserRole } from '@domain/models'

const ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'TEACHER', label: 'Teacher' },
  { value: 'ADMIN', label: 'Admin' },
]

function roleLabel(role: UserRole): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role
}

export default function AdminUsersPage() {
  const colors = useTheme()
  const currentUser = useAuthStore((s) => s.user)
  const {
    users,
    total,
    page,
    pages,
    filters,
    isLoading,
    error,
    setPage,
    setFilters,
    toggleActivation,
    changeRole,
    removeUser,
  } = useAdminUsers()

  const [searchInput, setSearchInput] = useState(filters.search)
  const [rowBusyId, setRowBusyId] = useState<string | null>(null)

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    setFilters({ search: searchInput })
  }

  async function handleToggle(user: User) {
    setRowBusyId(user.id)
    try {
      await toggleActivation(user)
    } catch {
      // handled by hook; toast omitted
    } finally {
      setRowBusyId(null)
    }
  }

  async function handleRoleChange(user: User, role: UserRole) {
    setRowBusyId(user.id)
    try {
      await changeRole(user, role)
    } catch {
      // handled by hook
    } finally {
      setRowBusyId(null)
    }
  }

  async function handleDelete(user: User) {
    if (user.id === currentUser?.id) {
      alert("You cannot delete yourself.")
      return
    }
    if (!window.confirm(`Are you sure you want to delete ${user.email}?`)) return
    
    setRowBusyId(user.id)
    try {
      await removeUser(user)
    } catch {
      // handled by hook
    } finally {
      setRowBusyId(null)
    }
  }

  const inputStyle: React.CSSProperties = {
    padding: '0.5rem 0.75rem',
    borderRadius: '0.5rem',
    border: `1.5px solid ${colors.border}`,
    background: colors.surface,
    color: colors.text,
    fontSize: '0.875rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '0.75rem 1rem',
    fontSize: '0.6875rem',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: colors.textMuted,
    borderBottom: `1px solid ${colors.border}`,
    background: colors.backgroundAlt,
  }

  const tdStyle: React.CSSProperties = {
    padding: '0.875rem 1rem',
    fontSize: '0.875rem',
    color: colors.text,
    borderBottom: `1px solid ${colors.border}`,
    verticalAlign: 'middle',
  }

  return (
    <div style={{ fontFamily: "'Geist', 'Inter', sans-serif", width: '100%' }}>
      <div style={{ marginBottom: '2rem' }}>
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
          Admin
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
          User management
        </h1>
        <p style={{ margin: '0.5rem 0 0', color: colors.textMuted, fontSize: '0.9375rem' }}>
          {total} {total === 1 ? 'user' : 'users'} total
        </p>
      </div>

      {/* Filters */}
      <form
        onSubmit={submitSearch}
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          alignItems: 'center',
        }}
      >
        <input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Search by name or email"
          style={{ ...inputStyle, flex: '1 1 240px', minWidth: '200px' }}
        />
        <select
          value={filters.role ?? ''}
          onChange={(e) => setFilters({ role: (e.target.value || undefined) as UserRole | undefined })}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">All roles</option>
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
        <select
          value={filters.isActive === undefined ? '' : filters.isActive ? 'active' : 'inactive'}
          onChange={(e) => {
            const v = e.target.value
            setFilters({ isActive: v === '' ? undefined : v === 'active' })
          }}
          style={{ ...inputStyle, cursor: 'pointer' }}
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <button
          type="submit"
          style={{
            padding: '0.5rem 1.125rem',
            borderRadius: '0.5rem',
            background: colors.primary,
            color: '#fff',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Search
        </button>
      </form>

      {error && (
        <div
          style={{
            background: colors.errorBg,
            border: `1px solid ${colors.errorBorder}`,
            borderRadius: '0.5rem',
            padding: '0.75rem 1rem',
            color: colors.error,
            fontSize: '0.875rem',
            marginBottom: '1rem',
          }}
        >
          {error}
        </div>
      )}

      {/* Table */}
      <div
        style={{
          background: colors.surface,
          border: `1px solid ${colors.border}`,
          borderRadius: '0.75rem',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Role</th>
                <th style={thStyle}>Status</th>
                <th style={{ ...thStyle, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: colors.textMuted }}>
                    Loading users&hellip;
                  </td>
                </tr>
              )}
              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: colors.textMuted }}>
                    No users match these filters.
                  </td>
                </tr>
              )}
              {users.map((u) => {
                const isSelf = currentUser?.id === u.id
                const busy = rowBusyId === u.id
                const disableToggle = (isSelf && u.is_active) || busy
                return (
                  <tr key={u.id}>
                    <td style={tdStyle}>
                      <span style={{ fontWeight: 500 }}>{u.email}</span>
                      {isSelf && (
                        <span
                          style={{
                            marginLeft: '0.5rem',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            padding: '0.125rem 0.5rem',
                            borderRadius: '9999px',
                            background: colors.primaryLight,
                            color: colors.primary,
                          }}
                        >
                          You
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>{u.full_name}</td>
                    <td style={tdStyle}>
                      <select
                        value={u.role}
                        disabled={busy || isSelf}
                        onChange={(e) => handleRoleChange(u, e.target.value as UserRole)}
                        style={{
                          ...inputStyle,
                          padding: '0.375rem 0.5rem',
                          fontSize: '0.8125rem',
                          cursor: busy || isSelf ? 'not-allowed' : 'pointer',
                          opacity: busy || isSelf ? 0.6 : 1,
                        }}
                        title={isSelf ? 'You cannot change your own role' : undefined}
                      >
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={tdStyle}>
                      <StatusToggle
                        active={u.is_active}
                        disabled={disableToggle}
                        colors={colors}
                        onClick={() => handleToggle(u)}
                        title={
                          isSelf && u.is_active
                            ? 'Admins cannot deactivate themselves'
                            : u.is_active
                              ? 'Deactivate'
                              : 'Activate'
                        }
                      />
                      <span
                        style={{
                          marginLeft: '0.625rem',
                          fontSize: '0.8125rem',
                          color: u.is_active ? colors.success : colors.textMuted,
                          fontWeight: 500,
                        }}
                      >
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...tdStyle, textAlign: 'right', color: colors.textMuted, fontSize: '0.8125rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '0.75rem' }}>
                        {!isSelf && (
                          <button
                            type="button"
                            onClick={() => handleDelete(u)}
                            disabled={busy}
                            style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.375rem',
                              background: colors.errorBg,
                              color: colors.error,
                              border: `1px solid ${colors.errorBorder}`,
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: busy ? 'not-allowed' : 'pointer',
                              opacity: busy ? 0.6 : 1,
                              transition: 'all 0.15s ease',
                            }}
                            title="Delete user"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: '1rem',
          fontSize: '0.8125rem',
          color: colors.textMuted,
        }}
      >
        <span>
          Page {page} of {pages}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <PaginationButton
            colors={colors}
            disabled={page <= 1 || isLoading}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </PaginationButton>
          <PaginationButton
            colors={colors}
            disabled={page >= pages || isLoading}
            onClick={() => setPage(page + 1)}
          >
            Next
          </PaginationButton>
        </div>
      </div>
    </div>
  )
}

interface StatusToggleProps {
  active: boolean
  disabled: boolean
  colors: ReturnType<typeof useTheme>
  onClick: () => void
  title?: string
}

function StatusToggle({ active, disabled, colors, onClick, title }: StatusToggleProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={active}
      style={{
        width: '36px',
        height: '20px',
        borderRadius: '9999px',
        background: active ? colors.primary : colors.border,
        border: 'none',
        position: 'relative',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        padding: 0,
        verticalAlign: 'middle',
        transition: 'background 0.15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '2px',
          left: active ? '18px' : '2px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.15s ease',
          boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
        }}
      />
    </button>
  )
}

interface PaginationButtonProps {
  colors: ReturnType<typeof useTheme>
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}

function PaginationButton({ colors, disabled, onClick, children }: PaginationButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.375rem 0.875rem',
        borderRadius: '0.5rem',
        border: `1.5px solid ${colors.border}`,
        background: colors.surface,
        color: disabled ? colors.textMuted : colors.text,
        fontSize: '0.8125rem',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {children}
    </button>
  )
}
