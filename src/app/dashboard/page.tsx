'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  name: string
  role: string
  inspectorId: string
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check auth
    const userData =
      localStorage.getItem('user') || sessionStorage.getItem('user')
    const token =
      localStorage.getItem('token') || sessionStorage.getItem('token')

    if (!userData || !token) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
  }, [router])

  function handleLogout() {
    localStorage.clear()
    sessionStorage.clear()
    router.push('/')
  }

  if (!user) return null

  const isLead = user.role === 'LEAD_INSPECTOR'
  const isAdmin = user.role === 'GCAA_ADMIN'

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Top navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e8f0e8',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src="/toplogo.png" alt="GCAA" style={{ width: '36px', height: '36px' }} />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#1a1a1a' }}>
              SAFA Ramp Inspection
            </div>
            <div style={{ fontSize: '11px', color: '#888' }}>UAE GCAA — FOA Division</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a1a' }}>{user.name}</div>
            <div style={{ fontSize: '11px', color: '#00a651' }}>
              {user.role.replace('_', ' ')} · {user.inspectorId}
            </div>
          </div>
          <button onClick={handleLogout} style={{
            padding: '8px 16px', background: 'none',
            border: '1.5px solid #e8e8e8', borderRadius: '8px',
            fontSize: '13px', color: '#666', cursor: 'pointer',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Sign Out
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{ padding: '40px 32px', maxWidth: '1200px', margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '36px' }}>
          <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a1a', marginBottom: '4px' }}>
            Good day, {user.name.split(' ')[0]} 
          </h1>
          <p style={{ fontSize: '14px', color: '#888' }}>
            What would you like to do today?
          </p>
        </div>

        {/* Action cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '40px' }}>

          {/* New Inspection — Lead only */}
          {(isLead || isAdmin) && (
            <ActionCard
              icon="✈️"
              title="New Inspection"
              description="Create a new POI and start a ramp inspection session"
              color="#00a651"
              onClick={() => router.push('/inspection/new')}
            />
          )}

          {/* My Inspections */}
          <ActionCard
            icon="📋"
            title="My Inspections"
            description="View and continue your assigned inspection checklists"
            color="#2563eb"
            onClick={() => router.push('/inspection/list')}
          />

          {/* Reports */}
          <ActionCard
            icon="📄"
            title="Reports"
            description="View and download completed inspection PDF reports"
            color="#7c3aed"
            onClick={() => router.push('/reports')}
          />

          {/* Timesheets */}
          <ActionCard
            icon="⏱️"
            title="Timesheets"
            description="View your STO hours and inspection time logs"
            color="#d97706"
            onClick={() => router.push('/timesheets')}
          />

          {/* Admin — user management */}
          {isAdmin && (
            <ActionCard
              icon="👥"
              title="User Management"
              description="Review and activate inspector account requests"
              color="#dc2626"
              onClick={() => router.push('/admin/users')}
            />
          )}

        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          <StatCard label="Inspections This Month" value="—" />
          <StatCard label="Findings Recorded" value="—" />
          <StatCard label="Reports Generated" value="—" />
          <StatCard label="STO Hours" value="—" />
        </div>
      </div>
    </div>
  )
}

function ActionCard({ icon, title, description, color, onClick }: {
  icon: string
  title: string
  description: string
  color: string
  onClick: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? color : '#e8f0e8'}`,
        borderRadius: '14px',
        padding: '28px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? `0 8px 24px ${color}22` : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div style={{
        width: '48px', height: '48px', borderRadius: '12px',
        background: `${color}15`, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: '24px', marginBottom: '16px',
      }}>
        {icon}
      </div>
      <div style={{ fontSize: '16px', fontWeight: 700, color: '#1a1a1a', marginBottom: '6px' }}>
        {title}
      </div>
      <div style={{ fontSize: '13px', color: '#888', lineHeight: '1.5' }}>
        {description}
      </div>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      background: '#fff', border: '1.5px solid #e8f0e8',
      borderRadius: '12px', padding: '20px 24px',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 700, color: '#00a651', marginBottom: '4px' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: '#888' }}>{label}</div>
    </div>
  )
}