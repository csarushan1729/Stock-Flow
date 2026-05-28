import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import { getOrders, createOrder, deleteOrder } from '../api/orders'
import { getCustomers } from '../api/customers'
import { getProducts } from '../api/products'

export default function Orders() {
  const toast = useToast()
  const navigate = useNavigate()

  const [orders, setOrders]       = useState([])
  const [customers, setCustomers] = useState([])
  const [products, setProducts]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')

  // Create-order modal state
  const [createOpen, setCreateOpen] = useState(false)
  const [orderForm, setOrderForm]   = useState({ customer_id: '', items: [{ product_id: '', quantity: 1 }] })
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving]         = useState(false)

  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── Load ─────────────────────────────────────────────────────────────────────
  const load = () => {
    setLoading(true)
    Promise.all([getOrders(), getCustomers(), getProducts()])
      .then(([o, c, p]) => { setOrders(o); setCustomers(c); setProducts(p) })
      .catch(e => toast.error('Load Failed', e.message))
      .finally(() => setLoading(false))
  }
  useEffect(load, [])

  // ── Search ───────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase()
    return orders.filter(o =>
      String(o.id).includes(q) ||
      o.customer?.full_name?.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    )
  }, [orders, search])

  // ── Order form helpers ───────────────────────────────────────────────────────
  const openCreate = () => {
    setOrderForm({ customer_id: '', items: [{ product_id: '', quantity: 1 }] })
    setFormErrors({})
    setCreateOpen(true)
  }

  const addItem = () =>
    setOrderForm(f => ({ ...f, items: [...f.items, { product_id: '', quantity: 1 }] }))

  const removeItem = (idx) =>
    setOrderForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }))

  const updateItem = (idx, field, value) =>
    setOrderForm(f => ({
      ...f,
      items: f.items.map((item, i) => i === idx ? { ...item, [field]: value } : item),
    }))

  // ── Live total calculation ───────────────────────────────────────────────────
  const calculatedTotal = useMemo(() => {
    return orderForm.items.reduce((sum, item) => {
      const product = products.find(p => p.id === parseInt(item.product_id))
      return sum + (product ? product.price * (parseInt(item.quantity) || 0) : 0)
    }, 0)
  }, [orderForm.items, products])

  // ── Validation ────────────────────────────────────────────────────────────────
  const validate = () => {
    const errors = {}
    if (!orderForm.customer_id) errors.customer_id = 'Please select a customer'
    const itemErrors = orderForm.items.map((item, idx) => {
      const e = {}
      if (!item.product_id) e.product_id = 'Select a product'
      if (!item.quantity || parseInt(item.quantity) < 1) e.quantity = 'Qty ≥ 1'
      return e
    })
    if (itemErrors.some(e => Object.keys(e).length > 0)) errors.items = itemErrors
    // Check for duplicate products
    const ids = orderForm.items.map(i => i.product_id).filter(Boolean)
    if (new Set(ids).size !== ids.length) errors.duplicate = 'Duplicate products detected'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateOrder = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await createOrder({
        customer_id: parseInt(orderForm.customer_id),
        items: orderForm.items.map(i => ({
          product_id: parseInt(i.product_id),
          quantity: parseInt(i.quantity),
        })),
      })
      toast.success('Order Created', `Order placed successfully. Total: $${calculatedTotal.toFixed(2)}`)
      setCreateOpen(false)
      load()
    } catch (e) {
      toast.error('Order Failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteOrder(deleteId)
      toast.success('Order Cancelled', 'Order has been cancelled and stock restored.')
      setDeleteId(null)
      load()
    } catch (e) {
      toast.error('Cancel Failed', e.message)
    } finally {
      setDeleting(false)
    }
  }

  const statusBadge = (status) => {
    const map = {
      pending:   'badge-warning',
      completed: 'badge-success',
      cancelled: 'badge-danger',
      shipped:   'badge-info',
    }
    return <span className={`badge ${map[status] || 'badge-muted'}`}>{status}</span>
  }

  // ── Stock availability check for selected product ─────────────────────────────
  const getProductStock = (productId) => {
    const p = products.find(p => p.id === parseInt(productId))
    return p ? p.quantity : null
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h1 className="page-title">Orders</h1>
            <p className="page-subtitle">Create and track customer orders with automatic inventory management</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ New Order</button>
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search by order ID, customer…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <span className="badge badge-muted">
                {filtered.length} result{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <span className="badge badge-primary">{orders.length} orders</span>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-title">{search ? 'No results found' : 'No orders yet'}</div>
              <p className="empty-desc">
                {search ? `No orders match "${search}".` : 'Create your first order to get started.'}
              </p>
              {!search && <button className="btn btn-primary" onClick={openCreate}>+ New Order</button>}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id}>
                    <td>
                      <span style={{
                        fontFamily: 'Syne', fontWeight: 700,
                        color: 'var(--primary-light)', fontSize: 13
                      }}>
                        #ORD-{String(order.id).padStart(4, '0')}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>
                        {order.customer?.full_name || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {order.customer?.email}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-muted">
                        {order.item_count ?? order.items?.length ?? 0} item{(order.item_count ?? order.items?.length ?? 0) !== 1 ? 's' : ''}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--success)', fontSize: 15 }}>
                      ${Number(order.total_amount).toFixed(2)}
                    </td>
                    <td>{statusBadge(order.status)}</td>
                    <td className="td-muted">{new Date(order.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn-icon-only"
                          onClick={() => navigate(`/orders/${order.id}`)}
                          title="View details"
                        >
                          👁️
                        </button>
                        <button
                          className="btn-icon-only danger"
                          onClick={() => setDeleteId(order.id)}
                          title="Cancel order"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Create Order Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create New Order"
        size="lg"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateOrder} disabled={saving}>
              {saving ? 'Placing Order…' : 'Place Order'}
            </button>
          </>
        }
      >
        {/* Customer Select */}
        <div className="form-group">
          <label className="form-label">Customer <span>*</span></label>
          <select
            className="form-control"
            value={orderForm.customer_id}
            onChange={e => setOrderForm({ ...orderForm, customer_id: e.target.value })}
          >
            <option value="">— Select a customer —</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.full_name} ({c.email})</option>
            ))}
          </select>
          {formErrors.customer_id && <div className="form-error">⚠ {formErrors.customer_id}</div>}
        </div>

        <div className="divider" />

        {/* Order Items */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <label className="form-label" style={{ margin: 0 }}>
              Order Items <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <button className="btn btn-secondary btn-sm" onClick={addItem} type="button">
              + Add Item
            </button>
          </div>

          {formErrors.duplicate && (
            <div className="form-error" style={{ marginBottom: 8 }}>⚠ {formErrors.duplicate}</div>
          )}

          {orderForm.items.map((item, idx) => {
            const stock = getProductStock(item.product_id)
            const selectedProduct = products.find(p => p.id === parseInt(item.product_id))
            const itemErr = formErrors.items?.[idx] || {}

            return (
              <div key={idx} className="order-item-row">
                <div>
                  <select
                    className="form-control"
                    value={item.product_id}
                    onChange={e => updateItem(idx, 'product_id', e.target.value)}
                  >
                    <option value="">— Select product —</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id} disabled={p.quantity === 0}>
                        {p.name} — ${p.price.toFixed(2)} (stock: {p.quantity})
                      </option>
                    ))}
                  </select>
                  {itemErr.product_id && <div className="form-error">⚠ {itemErr.product_id}</div>}
                  {selectedProduct && (
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>
                      SKU: {selectedProduct.sku} &nbsp;·&nbsp;
                      Available: <span style={{ color: stock <= 5 ? 'var(--warning)' : 'var(--success)' }}>{stock}</span>
                    </div>
                  )}
                </div>

                <div>
                  <input
                    className="form-control"
                    type="number"
                    min="1"
                    max={stock ?? 9999}
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={e => updateItem(idx, 'quantity', e.target.value)}
                  />
                  {itemErr.quantity && <div className="form-error">⚠ {itemErr.quantity}</div>}
                  {selectedProduct && item.quantity > 0 && (
                    <div style={{ fontSize: 11, color: 'var(--primary-light)', marginTop: 3 }}>
                      = ${(selectedProduct.price * (parseInt(item.quantity) || 0)).toFixed(2)}
                    </div>
                  )}
                </div>

                <button
                  className="btn-icon-only danger"
                  onClick={() => removeItem(idx)}
                  disabled={orderForm.items.length === 1}
                  title="Remove item"
                >
                  ✕
                </button>
              </div>
            )
          })}
        </div>

        {/* Live Total */}
        <div className="order-total-bar">
          <span className="order-total-label">Estimated Total</span>
          <span className="order-total-value">${calculatedTotal.toFixed(2)}</span>
        </div>
      </Modal>

      {/* ── Confirm Cancel ───────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Cancel Order?"
        message="Cancelling this order will restore the inventory stock for all items."
        confirmLabel="Cancel Order"
      />
    </div>
  )
}
