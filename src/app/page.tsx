'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import './login.css'

function SignupModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', inspectorId: '', email: '',
    password: '', confirmPassword: '', role: 'INSPECTOR'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Registration failed'); return }
      setSuccess(true)
    } catch { setError('Something went wrong.') }
    finally { setLoading(false) }
  }

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', border: '1.5px solid #e8e8e8',
    borderRadius: '8px', fontSize: '14px', color: '#222', background: '#fafdf6',
    outline: 'none', fontFamily: 'DM Sans, sans-serif', boxSizing: 'border-box',
    marginBottom: '0',
  }
  const lbl: React.CSSProperties = {
    display: 'block', fontSize: '13px', fontWeight: 500, color: '#444', marginBottom: '6px',
  }
  const overlay: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 100, backdropFilter: 'blur(4px)',
  }

  if (success) return (
    <div style={overlay}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '48px 44px',
        textAlign: 'center', maxWidth: '400px', width: '100%',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: '#00a651', fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
          Request Submitted
        </h2>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '28px' }}>
          Your account request has been submitted. An administrator will review and activate your account.
        </p>
        <button onClick={onClose} style={{
          padding: '11px 32px', background: '#00a651', border: 'none',
          borderRadius: '8px', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
        }}>Back to Login</button>
      </div>
    </div>
  )

  return (
    <div style={overlay}>
      <div style={{
        background: '#fff', borderRadius: '16px', padding: '40px 44px',
        width: '100%', maxWidth: '460px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '4px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#00a651' }}>Request Access</h2>
          <button onClick={onClose} style={{
            background: 'none', border: 'none', fontSize: '26px',
            color: '#aaa', cursor: 'pointer', lineHeight: 1,
          }}>×</button>
        </div>
        <p style={{ fontSize: '13px', color: '#888', marginBottom: '28px' }}>
          Fill in your details to request a SAFA system account.
        </p>
        <form onSubmit={handleSignup}>
          {[
            { label: 'Full Name', key: 'name', type: 'text', placeholder: 'Your full name' },
            { label: 'Inspector ID', key: 'inspectorId', type: 'text', placeholder: 'e.g. AA 123' },
            { label: 'Email', key: 'email', type: 'email', placeholder: 'your@gcaa.gov.ae' },
            { label: 'Password', key: 'password', type: 'password', placeholder: '••••••••' },
            { label: 'Confirm Password', key: 'confirmPassword', type: 'password', placeholder: '••••••••' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '16px' }}>
              <label style={lbl}>{f.label}</label>
              <input style={inp} type={f.type} placeholder={f.placeholder} required
                value={form[f.key as keyof typeof form]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })} />
            </div>
          ))}
          <div style={{ marginBottom: '24px' }}>
            <label style={lbl}>Role</label>
            <select style={inp} value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              <option value="INSPECTOR">Inspector</option>
              <option value="LEAD_INSPECTOR">Lead Inspector</option>
              <option value="GCAA_ADMIN">GCAA Admin</option>
            </select>
          </div>
          {error && (
            <div style={{
              background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '8px',
              padding: '11px 14px', color: '#dc2626', fontSize: '13px', marginBottom: '18px',
            }}>{error}</div>
          )}
          <button type="submit" disabled={loading} style={{
            width: '100%', padding: '13px', background: loading ? '#7fcfa4' : '#00a651',
            border: 'none', borderRadius: '8px', color: '#fff', fontSize: '15px',
            fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            {loading ? 'Submitting...' : 'Submit Request'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [inspectorId, setInspectorId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [showSignup, setShowSignup] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inspectorId, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Login failed'); return }
      if (rememberMe) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      } else {
        sessionStorage.setItem('token', data.token)
        sessionStorage.setItem('user', JSON.stringify(data.user))
      }
      router.push('/dashboard')
    } catch { setError('Something went wrong. Please try again.') }
    finally { setLoading(false) }
  }

  return (
    <>
      {showSignup && <SignupModal onClose={() => setShowSignup(false)} />}

      <div className="login-wrapper">

        {/* Left panel */}
        <div className="left-panel">
          <div className="topo-bg" />
          <div className="gcaa-logo-area">
            <img src="/gcaa-logo.png" alt="GCAA Logo" style={{ width: '550px', height: 'auto' }} />
          </div>
        </div>

        {/* Right panel */}
        <div className="right-panel">
          <div className="login-form-container">
            <h1 className="login-title">SAFA Ramp Inspection</h1>
            <p className="login-subtitle">Welcome back! Please sign in to your account.</p>

            <form onSubmit={handleLogin}>
              <div className="field-group">
                <label className="field-label">Inspector ID</label>
                <input className="field-input" type="text" value={inspectorId}
                  onChange={e => setInspectorId(e.target.value)}
                  placeholder="e.g. AA 123" required />
              </div>

              <div className="field-group">
                <label className="field-label">Password</label>
                <div className="password-wrapper">
                  <input className="field-input"
                    type={showPassword ? 'text' : 'password'}
                    value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••" required
                    style={{ paddingRight: '44px' }} />
                  <button type="button" className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? '🙈' : '👁'}
                  </button>
                </div>
              </div>

              <div className="options-row">
                <label className="remember-label">
                  <input type="checkbox" checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)} />
                  Remember me
                </label>
                <a href="#" className="forgot-link">Forgot Password</a>
              </div>

              {error && <div className="error-box">{error}</div>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? 'Signing in...' : 'Login'}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">Don&apos;t have an account?</span>
              <div className="divider-line" />
            </div>

            <div className="signup-row">
              <span className="signup-link" onClick={() => setShowSignup(true)}>
                Request Access
              </span>
            </div>

            <p className="footer-note">GCAA © 2026 — For authorized personnel only</p>
          </div>
        </div>
      </div>
    </>
  )
}