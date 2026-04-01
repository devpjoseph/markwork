import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import { useTheme } from '@application/theme/useTheme'

export default function FullScreenLayout() {
  const colors = useTheme()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: colors.background }}>
      <Navbar />
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </div>
    </div>
  )
}
