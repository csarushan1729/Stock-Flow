import { useState, useEffect, useMemo } from 'react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'

const EMPTY_FORM = { name: '', sku: '', price: '', quantity: '', description: '' }

export default function Products() {
  const toast = useToast()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [editProduct, setEditProduct] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // ── Load ────────────────────────────────────────────────────────────────────
  const load = () => {
    setLoading(true)
    getProducts()
      .then(setProducts)
      .catch(e => toast.error('Load Failed', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  // ── Search filter ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!search.trim()) return products
    const q = search.toLowerCase()
    return products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sku.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q)
    )
  }, [products, search])

  // ── Form handling ───────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditProduct(null)
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  const openEdit = (p) => {
    setEditProduct(p)
    setForm({ name: p.name, sku: p.sku, price: String(p.price), quantity: String(p.quantity), description: p.description || '' })
    setFormErrors({})
    setModalOpen(true)
  }

  const closeModal = () => { setModalOpen(false); setEditProduct(null) }

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = 'Name is required'
    if (!form.sku.trim())  errors.sku  = 'SKU is required'
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) errors.price = 'Price must be > 0'
    if (form.quantity === '' || isNaN(form.quantity) || Number(form.quantity) < 0) errors.quantity = 'Quantity must be ≥ 0'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    const data = {
      name: form.name.trim(),
      sku: form.sku.trim(),
      price: parseFloat(form.price),
      quantity: parseInt(form.quantity),
      description: form.description.trim() || null,
    }
    try {
      if (editProduct) {
        await updateProduct(editProduct.id, data)
        toast.success('Product Updated', `"${data.name}" has been updated.`)
      } else {
        await createProduct(data)
        toast.success('Product Created', `"${data.name}" has been added.`)
      }
      closeModal()
      load()
    } catch (e) {
      toast.error('Save Failed', e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProduct(deleteId)
      toast.success('Product Deleted', 'The product has been removed.')
      setDeleteId(null)
      load()
    } catch (e) {
      toast.error('Delete Failed', e.message)
    } finally {
      setDeleting(false)
    }
  }

  const stockBadge = (qty) => {
    if (qty === 0)   return <span className="badge badge-danger">Out of Stock</span>
    if (qty <= 5)    return <span className="badge badge-danger">{qty} left</span>
    if (qty <= 10)   return <span className="badge badge-warning">{qty} low</span>
    return                  <span className="badge badge-success">{qty} in stock</span>
  }

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h1 className="page-title">Products</h1>
            <p className="page-subtitle">Manage your product catalog and inventory levels</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            {search && (
              <span className="badge badge-muted">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            )}
          </div>
          <span className="badge badge-primary">{products.length} products</span>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner"/></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📦</div>
              <div className="empty-title">{search ? 'No results found' : 'No products yet'}</div>
              <p className="empty-desc">
                {search ? `No products match "${search}". Try a different search.` : 'Get started by adding your first product.'}
              </p>
              {!search && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td className="td-muted" style={{ width: 48 }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{p.name}</div>
                      {p.description && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{p.description}</div>}
                    </td>
                    <td><code className="td-mono">{p.sku}</code></td>
                    <td style={{ fontWeight: 700, color: 'var(--success)' }}>${Number(p.price).toFixed(2)}</td>
                    <td>{stockBadge(p.quantity)}</td>
                    <td className="td-muted">{new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn-icon-only" onClick={() => openEdit(p)} title="Edit">✏️</button>
                        <button className="btn-icon-only danger" onClick={() => setDeleteId(p.id)} title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editProduct ? 'Edit Product' : 'Add New Product'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={closeModal} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : editProduct ? 'Save Changes' : 'Add Product'}
            </button>
          </>
        }
      >
        <div className="form-row">
          <Field label="Product Name" required error={formErrors.name}>
            <input className="form-control" placeholder="e.g. Widget Pro" value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} />
          </Field>
          <Field label="SKU / Code" required error={formErrors.sku}>
            <input className="form-control" placeholder="e.g. WGT-001" value={form.sku}
              onChange={e => setForm({...form, sku: e.target.value.toUpperCase()})} />
          </Field>
        </div>
        <div className="form-row">
          <Field label="Price ($)" required error={formErrors.price}>
            <input className="form-control" type="number" step="0.01" min="0.01" placeholder="0.00" value={form.price}
              onChange={e => setForm({...form, price: e.target.value})} />
          </Field>
          <Field label="Quantity in Stock" required error={formErrors.quantity}>
            <input className="form-control" type="number" min="0" placeholder="0" value={form.quantity}
              onChange={e => setForm({...form, quantity: e.target.value})} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className="form-control" placeholder="Optional product description…" value={form.description}
            onChange={e => setForm({...form, description: e.target.value})} />
        </Field>
      </Modal>

      {/* ── Confirm Delete ───────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Product?"
        message="This will permanently remove the product. Orders referencing this product will not be affected."
      />
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span>*</span>}</label>
      {children}
      {error && <div className="form-error">⚠ {error}</div>}
    </div>
  )
}
