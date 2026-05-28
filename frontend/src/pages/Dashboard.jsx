import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboardStats } from '../api/orders'

const STAT_CONFIGS = [
  {
    key: 'total_products',
    label: 'Total Products',
    icon: '📦',
    color: '#4F7FFF',
    bg: 'rgba(79,127,255,0.12)',
    link: '/products',
  },
  {
    key: 'total_customers',
    label: 'Total Customers',
    icon: '👥',
    color: '#2DD4BF',
    bg: 'rgba(45,212,191,0.12)',
    link: '/customers',
  },
  {
    key: 'total_orders',
    label: 'Total Orders',
    icon: '📋',
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
    link: '/orders',
  },
  {
    key: 'total_revenue',
    label: 'Total Revenue',
    icon: '💰',
    color: '#FFB547',
    bg: 'rgba(255,181,71,0.12)',
    format: (v) => `$${Number(v).toLocaleString('en', { minimumFractionDigits: 2 })}`,
  },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="page-enter">
      <div className="page-header"><div className="page-header-inner"><div><h1 className="page-title">Dashboard</h1></div></div></div>
      <div className="page-body"><div className="spinner-wrap"><div className="spinner"/></div></div>
    </div>
  )

  if (error) return (
    <div className="page-enter page-body">
      <div className="card"><div className="card-body" style={{ color: 'var(--danger)', textAlign: 'center' }}>
        ⚠️ {error}
      </div></div>
    </div>
  )

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back — here's what's happening with your inventory</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/products" className="btn btn-secondary btn-sm">+ Add Product</Link>
            <Link to="/orders" className="btn btn-primary btn-sm">+ New Order</Link>
          </div>
        </div>
      </div>

      <div className="page-body">
        {/* ── Stat Cards ──────────────────────────────────────────── */}
        <div className="stat-grid">
          {STAT_CONFIGS.map(cfg => (
            <StatCard
              key={cfg.key}
              label={cfg.label}
              value={cfg.format ? cfg.format(stats[cfg.key]) : stats[cfg.key]}
              icon={cfg.icon}
              color={cfg.color}
              bg={cfg.bg}
              link={cfg.link}
            />
          ))}
        </div>

        {/* ── Low Stock Alert ──────────────────────────────────────── */}
        {stats.low_stock_products?.length > 0 && (
          <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠️</span>
                <span className="card-title">Low Stock Alert</span>
                <span className="badge badge-warning" style={{ marginLeft: 4 }}>
                  {stats.low_stock_products.length} item{stats.low_stock_products.length !== 1 ? 's' : ''}
                </span>
              </div>
              <Link to="/products" className="btn btn-secondary btn-sm">View All</Link>
            </div>
            <div className="card-body">
              <div className="low-stock-grid">
                {stats.low_stock_products.map(p => (
                  <div key={p.id} className="low-stock-item">
                    <div className={`low-stock-dot${p.quantity === 0 ? ' critical' : ''}`} />
                    <div>
                      <div className="low-stock-name">{p.name}</div>
                      <div className="low-stock-sku">{p.sku}</div>
                    </div>
                    <div className={`low-stock-qty${p.quantity === 0 ? ' critical' : ''}`}>
                      {p.quantity === 0 ? 'OUT' : p.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Quick Links ──────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {[
            { to: '/products',  icon: '📦', label: 'Manage Products',  desc: 'Add, edit, or remove products' },
            { to: '/customers', icon: '👥', label: 'Manage Customers', desc: 'View and manage your customers' },
            { to: '/orders',    icon: '📋', label: 'View Orders',      desc: 'Track and manage orders' },
          ].map(item => (
            <Link key={item.to} to={item.to} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'transform 180ms, box-shadow 180ms' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
                <div className="card-body" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ fontSize: 28 }}>{item.icon}</div>
                  <div>
                    <div style={{ fontFamily: 'Syne', fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{item.desc}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, color, bg, link }) {
  const content = (
    <div className="stat-card" style={{ '--stat-color': color, '--stat-bg': bg }}>
      <div className="stat-card-header">
        <div className="stat-label">{label}</div>
        <div className="stat-icon">{icon}</div>
      </div>
      <div className="stat-value">{value}</div>
      {link && <div className="stat-meta">Click to view →</div>}
    </div>
  )
  return link ? <Link to={link} style={{ textDecoration: 'none' }}>{content}</Link> : content
}
