import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { LocaleProvider } from '@/contexts/LocaleContext'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import ProtectedRoute from '@/components/ProtectedRoute'
import Login from '@/pages/Login'
import Home from '@/pages/Home'
import CreateRoom from '@/pages/CreateRoom'
import JoinRoom from '@/pages/JoinRoom'
import Room from '@/pages/Room'
import Settings from '@/pages/Settings'

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <>{children}</>
}

export default function App() {
  return (
    <ThemeProvider>
    <LocaleProvider>
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <AuthGuard>
              <Login />
            </AuthGuard>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="room/new" element={<CreateRoom />} />
          <Route path="room/join" element={<JoinRoom />} />
          <Route path="room/:id" element={<Room />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
    <Toaster position="bottom-center" richColors />
    </LocaleProvider>
  </ThemeProvider>
  )
}
