import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Register() {
  const { register, loading } = useAuth()
  const toast    = useToast()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ full_name: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.full_name.trim())  e.full_name = 'Full name is required'
    if (!form.email.trim())      e.email     = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)          e.password  = 'Password is required'
    else if (form.password.length < 6)         e.password = 'Minimum 6 characters'
    if (form.password !== form.confirm)        e.confirm  = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    const result = await register({
      full_name: form.full_name,
      email:     form.email,
      password:  form.password,
    })
    if (result.ok) {
      toast.success('Account created!', 'Welcome to StockFlow.')
      navigate('/')
    } else {
      toast.error('Registration Failed', result.error)
    }
  }

  return (
    <div style={authPageStyle}>
      {/* Background blobs */}
      <div style={{ ...blobStyle, top: -80, right: -80, background: 'radial-gradient(circle, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
      <div style={{ ...blobStyle, bottom: -80, left: -80, background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', width: 500, height: 500 }} />

      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12,
            background: 'linear-gradient(135deg, #4F7FFF 0%, #7C3AED 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, margin: '0 auto 14px',
            boxShadow: '0 0 24px rgba(79,127,255,0.4)'
          }}>📦</div>
          <h1 style={{
            fontFamily: 'Syne, sans-serif', fontSize: 26, fontWeight: 800,
            color: 'var(--text-primary)', letterSpacing: '-0.03em', marginBottom: 6
          }}>Create account</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
            Join StockFlow and start managing inventory
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name <span>*</span></label>
            <input
              className="form-control"
              placeholder="Jane Smith"
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              autoComplete="name"
            />
            {errors.full_name && <div className="form-error">⚠ {errors.full_name}</div>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address <span>*</span></label>
            <input
              className="form-control"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />
            {errors.email && <div className="form-error">⚠ {errors.email}</div>}
          </div>

          {/* Password */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password <span>*</span></label>
              <div style={{ position: 'relative' }}>
                <input
                  className="form-control"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min 6 chars"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  autoComplete="new-password"
                  style={{ paddingRight: 40 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  style={{
                    position: 'absolute', right: 10, top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 15,
                    color: 'var(--text-muted)', padding: 0
                  }}
                >{showPass ? '🙈' : '👁️'}</button>
              </div>
              {errors.password && <div className="form-error">⚠ {errors.password}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password <span>*</span></label>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="Repeat password"
                value={form.confirm}
                onChange={e => setForm({ ...form, confirm: e.target.value })}
                autoComplete="new-password"
              />
              {errors.confirm && <div className="form-error">⚠ {errors.confirm}</div>}
            </div>
          </div>

          {/* Strength indicator */}
          {form.password && (
            <div style={{ marginTop: -10, marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 99,
                    background: getStrengthColor(form.password, i),
                    transition: 'background 300ms'
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {getStrengthLabel(form.password)}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 4 }}
          >
            {loading ? 'Creating account…' : 'Create Account →'}
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Already have an account?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <Link
          to="/login"
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
        >
          Sign In instead
        </Link>
      </div>
    </div>
  )
}

// ── Password strength helpers ──────────────────────────────────────────────
function getStrength(pw) {
  let score = 0
  if (pw.length >= 6)  score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

function getStrengthColor(pw, bar) {
  const s = getStrength(pw)
  if (bar > s) return 'var(--border-light)'
  if (s === 1)  return '#EF4444'
  if (s === 2)  return '#F59E0B'
  if (s === 3)  return '#3B82F6'
  return '#10B981'
}

function getStrengthLabel(pw) {
  const s = getStrength(pw)
  return ['', 'Weak', 'Fair', 'Good', 'Strong'][s] || ''
}

const authPageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--bg-base)',
  position: 'relative',
  overflow: 'hidden',
}

const cardStyle = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-light)',
  borderRadius: 'var(--radius-xl)',
  padding: '36px 36px',
  width: '100%',
  maxWidth: 460,
  position: 'relative',
  zIndex: 1,
  boxShadow: 'var(--shadow-lg)',
}

const blobStyle = {
  position: 'fixed',
  width: 600, height: 600,
  borderRadius: '50%',
  filter: 'blur(80px)',
  pointerEvents: 'none',
  zIndex: 0,
}
