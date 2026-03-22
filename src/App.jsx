import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout          from './components/Layout'
import AuthPage        from './pages/AuthPage'
import Dashboard       from './pages/Dashboard'
import Expenses        from './pages/Expenses'
import IncomePage      from './pages/IncomePage'
import Remittance      from './pages/Remittance'
import BudgetGrid      from './pages/BudgetGrid'
import MonthlyPlanner  from './pages/MonthlyPlanner'
import Settings        from './pages/Settings'

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ink">
      <div style={{
        width: 28, height: 28,
        border: '2px solid #21262D',
        borderTop: '2px solid #F0B429',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
    </div>
  )
}

function Guard({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/auth" replace />
}

function AppRoutes() {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return (
    <Routes>
      <Route path="/auth" element={user ? <Navigate to="/" replace /> : <AuthPage />} />
      <Route path="/" element={<Guard><Layout /></Guard>}>
        <Route index                element={<Dashboard />} />
        <Route path="expenses"      element={<Expenses />} />
        <Route path="income"        element={<IncomePage />} />
        <Route path="remittance"    element={<Remittance />} />
        <Route path="planner"       element={<MonthlyPlanner />} />
        <Route path="grid"          element={<BudgetGrid />} />
        <Route path="settings"      element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
