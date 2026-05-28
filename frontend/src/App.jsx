import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ToastProvider } from './context/ToastContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Customers from './pages/Customers'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main-content">
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/products"   element={<Products />} />
          <Route path="/customers"  element={<Customers />} />
          <Route path="/orders"     element={<Orders />} />
          <Route path="/orders/:id" element={<OrderDetail />} />
          <Route path="*"           element={<NotFound />} />
        </Routes>
      </main>
      {/* Mobile nav toggle */}
      <button
        className="mobile-nav-toggle"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label="Toggle navigation"
      >
        ☰
      </button>
    </div>
  )
}

function NotFound() {
  return (
    <div className="page-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16, opacity: 0.4 }}>404</div>
        <h2 style={{ fontFamily: 'Syne', fontSize: 24, color: 'var(--text-secondary)', marginBottom: 8 }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          The page you're looking for doesn't exist.
        </p>
        <a href="/" className="btn btn-primary">Go to Dashboard</a>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout />
      </ToastProvider>
    </BrowserRouter>
  )
}
