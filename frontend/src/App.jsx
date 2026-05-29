import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'
import Login from './pages/Login'
import Register from './pages/Register'

// ── Guard: redirect to /login if not authenticated ────────────────────────────
function RequireAuth({ children }) {
  const { isLoggedIn } = useAuth()
  const location = useLocation()
  if (!isLoggedIn) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }
  return children
}

// ── Guard: redirect to / if already logged in ─────────────────────────────────
function RedirectIfAuth({ children }) {
  const { isLoggedIn } = useAuth()
  if (isLoggedIn) return <Navigate to="/" replace />
  return children
}

// ── Top bar with user info + logout ───────────────────────────────────────────
function TopBar({ onMenuClick }) {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)

  const initials = user?.full_name
    ? user.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?'

  return (
    <div style={{
      height: 56,
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      padding: '0 32px',
      gap: 12,
      background: 'var(--bg-surface)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      {/* User menu */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'var(--bg-card)',
            border: '1px solid var(--border-light)',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 12px 6px 6px',
            cursor: 'pointer',
            transition: 'border-color 180ms',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border-focus)'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-light)'}
        >
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'linear-gradient(135deg, #4F7FFF 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0,
          }}>{initials}</div>
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user?.full_name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user?.email}</div>
          </div>
          <span style={{ color: 'var(--text-muted)', fontSize: 12, marginLeft: 2 }}>▾</span>
        </button>

        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setOpen(false)}
            />
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              background: 'var(--bg-card)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow)',
              minWidth: 180,
              zIndex: 100,
              overflow: 'hidden',
              animation: 'slideUp 160ms var(--ease)',
            }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Signed in as</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>
                  {user?.email}
                </div>
              </div>
              <button
                onClick={() => { logout(); setOpen(false) }}
                style={{
                  width: '100%', padding: '11px 16px',
                  background: 'none', border: 'none',
                  cursor: 'pointer', textAlign: 'left',
                  fontSize: 13, color: 'var(--danger)',
                  display: 'flex', alignItems: 'center', gap: 8,
                  transition: 'background 160ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-bg)'}
                onMouseLeave={e => e.currentTarget.style.background = 'none'}
              >
                🚪 Sign Out
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Main layout (only shown when logged in) ───────────────────────────────────
function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <TopBar onMenuClick={() => setSidebarOpen(o => !o)} />
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/products"   element={<Products />} />
          <Route path="/customers"  element={<Customers />} />
          <Route path="/orders"     element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="*"           element={<NotFound />} />
        </Routes>
      </div>
      <button
        className="mobile-nav-toggle"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle navigation"
      >☰</button>
    </div>
  )
}

function NotFound() {
  return (
    <div className="page-body" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'60vh', flexDirection:'column', gap:16, textAlign:'center' }}>
      <div style={{ fontSize: 64, opacity: 0.3, fontFamily: 'Syne, sans-serif', fontWeight: 800 }}>404</div>
      <h2 style={{ color: 'var(--text-secondary)', fontSize: 22 }}>Page Not Found</h2>
      <a href="/" className="btn btn-primary">Go to Dashboard</a>
    </div>
  )
}

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login"    element={<RedirectIfAuth><Login /></RedirectIfAuth>} />
            <Route path="/register" element={<RedirectIfAuth><Register /></RedirectIfAuth>} />

            {/* Protected routes */}
            <Route path="/*" element={<RequireAuth><Layout /></RequireAuth>} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
