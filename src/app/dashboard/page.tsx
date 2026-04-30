'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  PlaneTakeoff, AlertTriangle, CheckCircle2, Clock,
  Plus, LogOut, FileText, BarChart2, TrendingUp, Users
} from 'lucide-react'

interface User {
  name: string
  role: string
  inspectorId: string
}

interface Inspection {
  id: string
  poiNumber: string
  date: string
  place: string
  status: string
  aircraft?: { registration: string }
  operator?: { airlineName: string }
  _count?: { findings: number }
}

interface Stats {
  total: number
  withFindings: number
  submitted: number
  drafts: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, withFindings: 0, submitted: 0, drafts: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!userData || !token) { router.push('/'); return }
    setUser(JSON.parse(userData))
    fetchInspections(token)
  }, [router])

  async function fetchInspections(token: string) {
    try {
      const res = await fetch('/api/inspections', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) return
      const data = await res.json()
      setInspections(data.inspections || [])
      setStats(data.stats || { total: 0, withFindings: 0, submitted: 0, drafts: 0 })
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function handleLogout() {
    localStorage.clear()
    sessionStorage.clear()
    router.push('/')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric'
    })
  }

  function getStatusBadge(status: string) {
    const config: Record<string, { bg: string; color: string; border: string; label: string }> = {
      DRAFT:       { bg: '#f1f5f9', color: '#64748b', border: '#e2e8f0', label: 'Draft' },
      IN_PROGRESS: { bg: '#fef9c3', color: '#854d0e', border: '#fde68a', label: 'In Progress' },
      CLOSED:      { bg: '#dcfce7', color: '#166534', border: '#bbf7d0', label: 'Submitted' },
      APPROVED:    { bg: '#dcfce7', color: '#166534', border: '#bfdbfe', label: 'Approved' },
    }
    const c = config[status] || config.DRAFT
    return (
      <span style={{
        background: c.bg, color: c.color,
        border: `1px solid ${c.border}`,
        padding: '3px 10px', borderRadius: '20px',
        fontSize: '12px', fontWeight: 600,
      }}>
        {c.label}
      </span>
    )
  }

  // Compute extra stats from inspections
  const cat3Count = 0 // will come from findings later
  const completionRate = stats.total > 0
    ? Math.round((stats.submitted / stats.total) * 100)
    : 0

  if (!user) return null

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f8', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/toplogo.png" alt="GCAA" style={{ width: '30px', height: '40px' }} />
          <div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a' }}>
              SAFA Inspections
            </div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              Proof of Inspection Management System
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ textAlign: 'right', marginRight: '4px' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: '#64748b' }}>
              {user.role.replace(/_/g, ' ')} · {user.inspectorId}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '8px 14px', background: 'none',
            border: '1.5px solid #e2e8f0', borderRadius: '8px',
            fontSize: '13px', color: '#64748b', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <LogOut size={14} />
            Sign Out
          </button>
          <button onClick={() => router.push('/inspection/new')} style={{
            padding: '10px 18px', background: '#00a651',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#fff',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
          }}>
            <Plus size={15} />
            New Inspection
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>

        {/* Welcome bar */}
        <div style={{ marginBottom: '28px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1a1a1a', margin: '0 0 4px 0' }}>
            Welcome back, {user.name.split(' ')[0]}
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
            Here is an overview of your inspection activity
          </p>
        </div>

        {/* Primary stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px', marginBottom: '16px',
        }}>
          <StatCard
            label="Total Inspections"
            value={stats.total}
            icon={<FileText size={20} color="#00a651" />}
            iconBg="#dcfce7"
            valueColor="#1a1a1a"
          />
          <StatCard
            label="With Findings"
            value={stats.withFindings}
            icon={<AlertTriangle size={20} color="#d97706" />}
            iconBg="#fef9c3"
            valueColor="#d97706"
          />
          <StatCard
            label="Submitted"
            value={stats.submitted}
            icon={<CheckCircle2 size={20} color="#16a34a" />}
            iconBg="#dcfce7"
            valueColor="#16a34a"
          />
          <StatCard
            label="Drafts"
            value={stats.drafts}
            icon={<Clock size={20} color="#64748b" />}
            iconBg="#f1f5f9"
            valueColor="#64748b"
          />
        </div>

        {/* Secondary stats */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px', marginBottom: '28px',
        }}>
          <SecondaryCard
            label="Completion Rate"
            value={`${completionRate}%`}
            description="Submitted vs total inspections"
            icon={<TrendingUp size={16} color="#7c3aed" />}
            color="#7c3aed"
          />
          <SecondaryCard
            label="CAT 3 Findings"
            value={String(cat3Count)}
            description="Requires immediate action"
            icon={<AlertTriangle size={16} color="#dc2626" />}
            color="#dc2626"
          />
          <SecondaryCard
            label="Active Inspectors"
            value="—"
            description="Inspectors with activity this month"
            icon={<Users size={16} color="#0891b2" />}
            color="#0891b2"
          />
        </div>

        {/* Recent Inspections table */}
        <div style={{
          background: '#fff', borderRadius: '14px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '20px 24px', borderBottom: '1px solid #f1f5f9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <BarChart2 size={18} color="#00a651" />
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a', margin: 0 }}>
                Recent Inspections
              </h2>
            </div>
            <button onClick={() => router.push('/inspection/list')} style={{
              background: 'none', border: 'none', fontSize: '13px',
              color: '#00a651', cursor: 'pointer', fontWeight: 600,
              fontFamily: 'DM Sans, sans-serif',
            }}>
              View all →
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '48px', textAlign: 'center', color: '#94a3b8', fontSize: '14px' }}>
              Loading inspections...
            </div>
          ) : inspections.length === 0 ? (
            <div style={{ padding: '64px', textAlign: 'center' }}>
              <div style={{
                width: '56px', height: '56px', borderRadius: '14px',
                background: '#f1f5f9', display: 'flex', alignItems: 'center',
                justifyContent: 'center', margin: '0 auto 16px',
              }}>
                <FileText size={24} color="#94a3b8" />
              </div>
              <div style={{ fontSize: '15px', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                No inspections yet
              </div>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '20px' }}>
                Create your first inspection to get started
              </div>
              <button onClick={() => router.push('/inspection/new')} style={{
                padding: '10px 24px', background: '#00a651', border: 'none',
                borderRadius: '8px', color: '#fff', fontSize: '13px',
                fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}>
                <Plus size={14} /> New Inspection
              </button>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['POI Number', 'Date', 'Airport', 'Registration', 'Operator', 'Findings', 'Status'].map(h => (
                    <th key={h} style={{
                      padding: '12px 16px', textAlign: 'left',
                      fontSize: '11px', fontWeight: 600,
                      color: '#64748b', letterSpacing: '0.5px',
                      textTransform: 'uppercase',
                      borderBottom: '1px solid #f1f5f9',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inspections.map((ins, i) => (
                  <tr key={ins.id}
                    onClick={() => router.push(`/inspection/${ins.id}`)}
                    style={{
                      borderBottom: i < inspections.length - 1 ? '1px solid #f8fafc' : 'none',
                      cursor: 'pointer', transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ color: '#00a651', fontWeight: 600, fontSize: '13px' }}>
                        {ins.poiNumber}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                      {formatDate(ins.date)}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                      {ins.place || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                      {ins.aircraft?.registration || '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '13px', color: '#374151' }}>
                      {ins.operator?.airlineName || '—'}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '28px', height: '28px', borderRadius: '8px',
                        fontSize: '12px', fontWeight: 700,
                        background: (ins._count?.findings || 0) > 0 ? '#fef9c3' : '#f1f5f9',
                        color: (ins._count?.findings || 0) > 0 ? '#854d0e' : '#64748b',
                      }}>
                        {ins._count?.findings || 0}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      {getStatusBadge(ins.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, iconBg, valueColor }: {
  label: string
  value: number
  icon: React.ReactNode
  iconBg: string
  valueColor: string
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px',
      border: '1px solid #e2e8f0', padding: '20px 24px',
      display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div>
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{label}</div>
        <div style={{ fontSize: '32px', fontWeight: 700, color: valueColor }}>{value}</div>
      </div>
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: iconBg, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
      }}>
        {icon}
      </div>
    </div>
  )
}

function SecondaryCard({ label, value, description, icon, color }: {
  label: string
  value: string
  description: string
  icon: React.ReactNode
  color: string
}) {
  return (
    <div style={{
      background: '#fff', borderRadius: '12px',
      border: '1px solid #e2e8f0', padding: '18px 22px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
        {icon}
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          {label}
        </span>
      </div>
      <div style={{ fontSize: '28px', fontWeight: 700, color, marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8' }}>{description}</div>
    </div>
  )
}