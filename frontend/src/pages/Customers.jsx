import { useState, useEffect, useMemo } from 'react'
import Modal from '../components/Modal'
import ConfirmDialog from '../components/ConfirmDialog'
import { useToast } from '../context/ToastContext'
import { getCustomers, createCustomer, deleteCustomer } from '../api/customers'

const EMPTY_FORM = { full_name: '', email: '', phone: '' }

export default function Customers() {
  const toast = useToast()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [formErrors, setFormErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const [deleteId, setDeleteId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    getCustomers()
      .then(setCustomers)
      .catch(e => toast.error('Load Failed', e.message))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(() => {
    if (!search.trim()) return customers
    const q = search.toLowerCase()
    return customers.filter(c =>
      c.full_name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    )
  }, [customers, search])

  const openAdd = () => {
    setForm(EMPTY_FORM)
    setFormErrors({})
    setModalOpen(true)
  }

  const validate = () => {
    const errors = {}
    if (!form.full_name.trim()) errors.full_name = 'Full name is required'
    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (!form.phone.trim()) errors.phone = 'Phone number is required'
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      await createCustomer({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
      })
      toast.success('Customer Added', `${form.full_name} has been registered.`)
      setModalOpen(false)
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
      await deleteCustomer(deleteId)
      toast.success('Customer Deleted', 'The customer has been removed.')
      setDeleteId(null)
      load()
    } catch (e) {
      toast.error('Delete Failed', e.message)
    } finally {
      setDeleting(false)
    }
  }

  const getInitials = (name) =>
    name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()

  const AVATAR_COLORS = [
    '#4F7FFF','#2DD4BF','#A78BFA','#FFB547','#FF6B6B','#67E8F9','#34D399',
  ]
  const avatarColor = (id) => AVATAR_COLORS[id % AVATAR_COLORS.length]

  return (
    <div className="page-enter">
      <div className="page-header">
        <div className="page-header-inner">
          <div>
            <h1 className="page-title">Customers</h1>
            <p className="page-subtitle">Manage your customer database and contact information</p>
          </div>
          <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
        </div>
      </div>

      <div className="page-body">
        <div className="toolbar">
          <div className="toolbar-left">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                className="search-input"
                placeholder="Search customers..."
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
          <span className="badge badge-info">{customers.length} customers</span>
        </div>

        <div className="table-container">
          {loading ? (
            <div className="spinner-wrap"><div className="spinner" /></div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">{search ? 'No results found' : 'No customers yet'}</div>
              <p className="empty-desc">
                {search
                  ? `No customers match "${search}".`
                  : 'Add your first customer to get started.'}
              </p>
              {!search && (
                <button className="btn btn-primary" onClick={openAdd}>+ Add Customer</button>
              )}
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Registered</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td className="td-muted" style={{ width: 48 }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: avatarColor(c.id),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                        }}>
                          {getInitials(c.full_name)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{c.full_name}</span>
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${c.email}`}
                        style={{ color: 'var(--primary-light)', textDecoration: 'none', fontSize: 13 }}>
                        {c.email}
                      </a>
                    </td>
                    <td className="td-muted">{c.phone}</td>
                    <td className="td-muted">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn-icon-only danger"
                        onClick={() => setDeleteId(c.id)}
                        title="Delete customer"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── Add Customer Modal ───────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Customer"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving…' : 'Add Customer'}
            </button>
          </>
        }
      >
        <Field label="Full Name" required error={formErrors.full_name}>
          <input
            className="form-control"
            placeholder="e.g. Jane Smith"
            value={form.full_name}
            onChange={e => setForm({ ...form, full_name: e.target.value })}
          />
        </Field>
        <Field label="Email Address" required error={formErrors.email}>
          <input
            className="form-control"
            type="email"
            placeholder="jane@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Phone Number" required error={formErrors.phone}>
          <input
            className="form-control"
            type="tel"
            placeholder="+1 555 000 0000"
            value={form.phone}
            onChange={e => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
      </Modal>

      {/* ── Confirm Delete ───────────────────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Customer?"
        message="This will permanently remove the customer record. Their order history will also be deleted."
      />
    </div>
  )
}

function Field({ label, required, error, children }) {
  return (
    <div className="form-group">
      <label className="form-label">
        {label}{required && <span>*</span>}
      </label>
      {children}
      {error && <div className="form-error">⚠ {error}</div>}
    </div>
  )
}
