import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useTheme } from '@application/theme/useTheme'

export default function MainLayout() {
  const colors = useTheme()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: colors.background }}>
      <Navbar />
      <main className="main-content" style={{ flex: 1, overflowY: 'auto', boxSizing: 'border-box' }}>
        <Outlet />
      </main>
    </div>
  )
}
