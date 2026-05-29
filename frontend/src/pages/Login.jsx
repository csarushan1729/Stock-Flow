import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

export default function Login() {
  const { login, loading } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()

  const [form, setForm]     = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [showPass, setShowPass] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.email.trim())    e.email    = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password)        e.password = 'Password is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    const result = await login({ email: form.email, password: form.password })
    if (result.ok) {
      toast.success('Welcome back!', 'You are now signed in.')
      navigate('/')
    } else {
      toast.error('Login Failed', result.error)
    }
  }

  return (
    <div style={authPageStyle}>
      {/* Background blobs */}
      <div style={{ ...blobStyle, top: -100, left: -100, background: 'radial-gradient(circle, rgba(79,127,255,0.15) 0%, transparent 70%)' }} />
      <div style={{ ...blobStyle, bottom: -100, right: -100, background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)', width: 500, height: 500 }} />

      <div style={cardStyle}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
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
          }}>Welcome back</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5 }}>
            Sign in to your StockFlow account
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
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
          <div className="form-group">
            <label className="form-label">Password <span>*</span></label>
            <div style={{ position: 'relative' }}>
              <input
                className="form-control"
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  cursor: 'pointer', fontSize: 16,
                  color: 'var(--text-muted)', padding: 0
                }}
              >{showPass ? '🙈' : '👁️'}</button>
            </div>
            {errors.password && <div className="form-error">⚠ {errors.password}</div>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15, marginTop: 8 }}
          >
            {loading ? 'Signing in…' : 'Sign In →'}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No account yet?</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <Link
          to="/register"
          className="btn btn-secondary"
          style={{ width: '100%', justifyContent: 'center', padding: '11px' }}
        >
          Create an account
        </Link>
      </div>
    </div>
  )
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
  padding: '40px 36px',
  width: '100%',
  maxWidth: 420,
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
