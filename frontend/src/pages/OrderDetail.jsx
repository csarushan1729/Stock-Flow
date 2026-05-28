import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getOrder, deleteOrder } from '../api/orders'
import { useToast } from '../context/ToastContext'
import ConfirmDialog from '../components/ConfirmDialog'

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const toast = useToast()

  const [order, setOrder]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    getOrder(id)
      .then(setOrder)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleCancel = async () => {
    setDeleting(true)
    try {
      await deleteOrder(id)
      toast.success('Order Cancelled', 'Stock has been restored.')
      navigate('/orders')
    } catch (e) {
      toast.error('Cancel Failed', e.message)
      setDeleting(false)
    }
  }

  const statusConfig = {
    pending:   { badge: 'badge-warning', label: 'Pending',   icon: '⏳' },
    completed: { badge: 'badge-success', label: 'Completed', icon: '✅' },
    cancelled: { badge: 'badge-danger',  label: 'Cancelled', icon: '❌' },
    shipped:   { badge: 'badge-info',    label: 'Shipped',   icon: '🚚' },
  }

  if (loading) return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h1 className="page-title">Order Details</h1>
          </div>
        </div>
      </div>
      <div className="page-body"><div className="spinner-wrap"><div className="spinner" /></div></div>
    </div>
  )

  if (error || !order) return (
    <div className="page-enter page-body">
      <div className="card">
        <div className="card-body" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>😕</div>
          <div style={{ color: 'var(--danger)', fontWeight: 700, marginBottom: 8 }}>Order Not Found</div>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>{error || 'This order does not exist.'}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/orders')}>← Back to Orders</button>
        </div>
      </div>
    </div>
  )

  const cfg = statusConfig[order.status] || { badge: 'badge-muted', label: order.status, icon: '📋' }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <button
                onClick={() => navigate('/orders')}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: 13, display: 'flex',
                  alignItems: 'center', gap: 4, padding: 0
                }}
              >
                ← Orders
              </button>
              <span style={{ color: 'var(--border-light)' }}>/</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontFamily: 'Syne', fontWeight: 700 }}>
                #ORD-{String(order.id).padStart(4, '0')}
              </span>
            </div>
            <h1 className="page-title">Order #{String(order.id).padStart(4, '0')}</h1>
            <p className="page-subtitle">
              Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <span className={`badge ${cfg.badge}`} style={{ fontSize: 13, padding: '6px 14px' }}>
              {cfg.icon} {cfg.label}
            </span>
            {order.status !== 'cancelled' && (
              <button className="btn btn-danger" onClick={() => setShowConfirm(true)}>
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>

          {/* ── Items Table ─────────────────────────────────────────────────── */}
          <div>
            <div className="card">
              <div className="card-header">
                <span className="card-title">Order Items</span>
                <span className="badge badge-muted">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="table-container" style={{ border: 'none', borderRadius: 0 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Unit Price</th>
                      <th>Qty</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map(item => (
                      <tr key={item.id}>
                        <td>
                          <div style={{ fontWeight: 600 }}>{item.product?.name || `Product #${item.product_id}`}</div>
                          {item.product?.description && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                              {item.product.description}
                            </div>
                          )}
                        </td>
                        <td><code className="td-mono">{item.product?.sku || '—'}</code></td>
                        <td style={{ color: 'var(--text-secondary)' }}>${Number(item.unit_price).toFixed(2)}</td>
                        <td>
                          <span className="badge badge-muted">×{item.quantity}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: 'var(--success)' }}>
                          ${(item.unit_price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{
                padding: '16px 20px',
                borderTop: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'center',
                gap: 16
              }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Order Total</span>
                <span style={{
                  fontFamily: 'Syne', fontSize: 24, fontWeight: 800,
                  color: 'var(--text-primary)'
                }}>
                  ${Number(order.total_amount).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* ── Sidebar Info ─────────────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Customer Info */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Customer</span>
              </div>
              <div className="card-body">
                {order.customer ? (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div style={{
                        width: 42, height: 42, borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary) 0%, #7C3AED 100%)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, fontWeight: 800, color: '#fff', flexShrink: 0
                      }}>
                        {order.customer.full_name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                          {order.customer.full_name}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                          ID #{order.customer.id}
                        </div>
                      </div>
                    </div>
                    <InfoRow icon="✉️" label="Email" value={order.customer.email} />
                    <InfoRow icon="📞" label="Phone" value={order.customer.phone} />
                  </>
                ) : (
                  <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Customer data unavailable</span>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Summary</span>
              </div>
              <div className="card-body">
                <InfoRow icon="🔖" label="Order ID" value={`#ORD-${String(order.id).padStart(4, '0')}`} />
                <InfoRow icon="📅" label="Date" value={new Date(order.created_at).toLocaleDateString()} />
                <InfoRow icon="📦" label="Items" value={`${order.items?.length || 0} product${order.items?.length !== 1 ? 's' : ''}`} />
                <InfoRow
                  icon="💰"
                  label="Total"
                  value={`$${Number(order.total_amount).toFixed(2)}`}
                  valueStyle={{ color: 'var(--success)', fontWeight: 700 }}
                />
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>STATUS</div>
                  <span className={`badge ${cfg.badge}`}>{cfg.icon} {cfg.label}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleCancel}
        loading={deleting}
        title="Cancel this Order?"
        message="All ordered stock will be restored to inventory. This cannot be undone."
        confirmLabel="Yes, Cancel Order"
      />
    </div>
  )
}

function InfoRow({ icon, label, value, valueStyle = {} }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
      <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span>{icon}</span> {label}
      </span>
      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500, ...valueStyle }}>
        {value}
      </span>
    </div>
  )
}
