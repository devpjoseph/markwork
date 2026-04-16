import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@application/store/authStore'
import { useSSENotifications } from '@application/hooks/useSSENotifications'
import MainLayout from '@presentation/layouts/MainLayout'
import FullScreenLayout from '@presentation/layouts/FullScreenLayout'
import LoginPage from '@presentation/pages/LoginPage'
import DashboardPage from '@presentation/pages/DashboardPage'
import AssignmentEditorPage from '@presentation/pages/AssignmentEditorPage'
import AssignmentReviewPage from '@presentation/pages/AssignmentReviewPage'
import FocusedDocumentPage from '@presentation/pages/FocusedDocumentPage'
import AdminUsersPage from '@presentation/pages/AdminUsersPage'
import PendingApprovalPage from '@presentation/pages/PendingApprovalPage'
import RoleProtectedRoute from '@presentation/components/RoleProtectedRoute'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <>{children}</>
}

function AppRoutes() {
  useSSENotifications()

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/pending-approval" element={<ProtectedRoute><PendingApprovalPage /></ProtectedRoute>} />
      {/* Dashboard — padded layout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>
      {/* Admin — padded layout, ADMIN only */}
      <Route
        path="/admin"
        element={
          <RoleProtectedRoute role="ADMIN">
            <MainLayout />
          </RoleProtectedRoute>
        }
      >
        <Route path="users" element={<AdminUsersPage />} />
      </Route>
      {/* Full-screen editor/review — no padding, no outer scroll */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <FullScreenLayout />
          </ProtectedRoute>
        }
      >
        <Route path="assignments/:id/edit" element={<AssignmentEditorPage />} />
        <Route path="assignments/:id/review" element={<AssignmentReviewPage />} />
      </Route>
      {/* Focused document view — full-screen, outside any layout */}
      <Route
        path="/assignments/:id/focused"
        element={
          <ProtectedRoute>
            <FocusedDocumentPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
