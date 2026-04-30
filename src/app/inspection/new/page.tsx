'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Rocket, Calendar, Plane,
  Building2, User, Clock
} from 'lucide-react'

interface User {
  name: string
  role: string
  inspectorId: string
}

export default function NewInspectionPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const signatureRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const [form, setForm] = useState({
    // Inspection Details
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    place: 'OMDB',
    inspectionType: '',
    alcoholTest: '',
    flightType: '',
    flightCrew: '0',
    cabinCrew: '0',
    // Aircraft
    registration: '',
    typeModel: '',
    configuration: '',
    msn: '',
    // Operator
    airlineName: '',
    aoc: '',
    stateOfRegistry: '',
    charteredBy: '',
    chartererState: '',
    routeFrom: 'OMDB',
    flightNoIn: '',
    routeTo: '',
    flightNoOut: '',
  })

  useEffect(() => {
    const userData = localStorage.getItem('user') || sessionStorage.getItem('user')
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!userData || !token) { router.push('/'); return }
    setUser(JSON.parse(userData))
  }, [router])

  // Generate POI number
  const today = new Date()
  const poiNumber = `POI-${today.getFullYear()}${String(today.getMonth()+1).padStart(2,'0')}${String(today.getDate()).padStart(2,'0')}-${Math.floor(Math.random()*9000)+1000}`

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  // Signature canvas
  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = signatureRef.current
    if (!canvas) return
    setIsDrawing(true)
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing) return
    const canvas = signatureRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.stroke()
    setHasSignature(true)
  }

  function stopDraw() { setIsDrawing(false) }

  function clearSignature() {
    const canvas = signatureRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasSignature(false)
  }

  async function handleSubmit(isDraft: boolean) {
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const signature = hasSignature ? signatureRef.current?.toDataURL() : null

      const res = await fetch('/api/inspections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...form,
          poiNumber,
          status: isDraft ? 'DRAFT' : 'IN_PROGRESS',
          signature,
        }),
      })

      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to save'); return }

      if (isDraft) {
        router.push('/dashboard')
      } else {
        router.push(`/inspection/${data.inspectionId}/checklist`)
      }
    } catch {
      setError('Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '10px 14px',
    border: '1.5px solid #e0e7e0', borderRadius: '8px',
    fontSize: '14px', color: '#1a1a1a', background: '#fff',
    outline: 'none', fontFamily: 'DM Sans, sans-serif',
    boxSizing: 'border-box',
  }

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '11px', fontWeight: 600,
    color: '#666', letterSpacing: '0.6px',
    textTransform: 'uppercase', marginBottom: '6px',
  }

  const sectionStyle: React.CSSProperties = {
    background: '#fff', border: '1.5px solid #e8f0e8',
    borderRadius: '14px', padding: '28px',
    marginBottom: '20px',
  }

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: '15px', fontWeight: 700, color: '#1a1a1a',
    marginBottom: '20px', paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
    display: 'flex', alignItems: 'center', gap: '8px',
  }

  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: 'DM Sans, sans-serif', overflowX: 'hidden' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e8f0e8',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => router.push('/dashboard')} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#666', fontSize: '14px', display: 'flex',
            alignItems: 'center', gap: '6px', fontFamily: 'DM Sans, sans-serif',
          }}>
            <ArrowLeft size={15} /> Back
          </button>
          <div style={{ width: '1px', height: '20px', background: '#e0e0e0' }} />
          <img src="/toplogo.png" alt="GCAA" style={{ width: '32px', height: '32px' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>
              New Inspection
            </div>
            <div style={{ fontSize: '11px', color: '#00a651', fontWeight: 600 }}>
              {poiNumber}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
         <button onClick={() => handleSubmit(true)} disabled={loading} style={{
            padding: '9px 20px', background: '#fff',
            border: '1.5px solid #e0e0e0', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#444',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
            }}>
            <Save size={14} /> Save Draft
         </button>
         <button onClick={() => handleSubmit(false)} disabled={loading} style={{
            padding: '9px 20px', background: '#00a651',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#fff',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
          }}>
            <Rocket size={14} />  Start Inspection
          </button>
        </div>
      </nav>

      {/* Form */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px', boxSizing: 'border-box', width: '100%' }}>

        {error && (
          <div style={{
            background: '#fff5f5', border: '1px solid #fecaca',
            borderRadius: '8px', padding: '12px 16px',
            color: '#dc2626', fontSize: '13px', marginBottom: '20px',
          }}>{error}</div>
        )}

        {/* ── Section 1: Inspection Details ── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Calendar size={16} color="#00a651" /> Inspection Details
          </div>
          <div style={{ ...gridStyle, marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>POI Number</label>
              <input style={{ ...inputStyle, background: '#f8f8f8', color: '#888' }}
                value={poiNumber} readOnly />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input style={inputStyle} type="date"
                value={form.date} onChange={e => update('date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Start Time (Local)</label>
              <input style={inputStyle} type="time"
                value={form.startTime} onChange={e => update('startTime', e.target.value)}
                placeholder="HHMM" />
            </div>
            <div>
              <label style={labelStyle}>End Time (Local)</label>
              <input style={inputStyle} type="time"
                value={form.endTime} onChange={e => update('endTime', e.target.value)}
                placeholder="HHMM" />
            </div>
          </div>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Place (ICAO)</label>
              <input style={inputStyle} value={form.place}
                onChange={e => update('place', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Ramp Inspection Type</label>
              <select style={inputStyle} value={form.inspectionType}
                onChange={e => update('inspectionType', e.target.value)}>
                <option value="">Select</option>
                <option value="FULL">Full</option>
                <option value="PARTIAL">Partial</option>
                <option value="FOCUSED">Focused</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Alcohol Test</label>
              <select style={inputStyle} value={form.alcoholTest}
                onChange={e => update('alcoholTest', e.target.value)}>
                <option value="">YES / NO</option>
                <option value="true">YES</option>
                <option value="false">NO</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Flight Type (ICAO Annex 6)</label>
              <select style={inputStyle} value={form.flightType}
                onChange={e => update('flightType', e.target.value)}>
                <option value="">Select part</option>
                <option value="Part I">Part I — International Commercial Air Transport</option>
                <option value="Part II">Part II — International General Aviation</option>
                <option value="Part III">Part III — International Helicopter Operations</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Flight Crew</label>
              <input style={inputStyle} type="number" min="0"
                value={form.flightCrew} onChange={e => update('flightCrew', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Cabin Crew</label>
              <input style={inputStyle} type="number" min="0"
                value={form.cabinCrew} onChange={e => update('cabinCrew', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Section 2: Aircraft Information ── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Plane size={16} color="#00a651" /> Aircraft Information
          </div>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Registration</label>
              <input style={inputStyle} placeholder="e.g. N12345"
                value={form.registration} onChange={e => update('registration', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Type / Model</label>
              <input style={inputStyle} placeholder="e.g. B737-800"
                value={form.typeModel} onChange={e => update('typeModel', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Aircraft Configuration</label>
              <select style={inputStyle} value={form.configuration}
                onChange={e => update('configuration', e.target.value)}>
                <option value="">Select</option>
                <option value="PASSENGER">Passenger</option>
                <option value="CARGO">Cargo</option>
                <option value="COMBI">Combi</option>
                <option value="PRIVATE">Private</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>MSN</label>
              <input style={inputStyle} placeholder="e.g. 12345"
                value={form.msn} onChange={e => update('msn', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Section 3: Operator ── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <Building2 size={16} color="#00a651" /> Operatorr
          </div>
          <div style={{ ...gridStyle, marginBottom: '16px' }}>
            <div>
              <label style={labelStyle}>Operator</label>
              <input style={inputStyle} placeholder="Airline name"
                value={form.airlineName} onChange={e => update('airlineName', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>AOC No</label>
              <input style={inputStyle} placeholder="AOC Number"
                value={form.aoc} onChange={e => update('aoc', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>State</label>
              <input style={inputStyle} placeholder="State of registry"
                value={form.stateOfRegistry} onChange={e => update('stateOfRegistry', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Chartered by Operator</label>
              <input style={inputStyle} placeholder="Operator name"
                value={form.charteredBy} onChange={e => update('charteredBy', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Charterer's State</label>
              <input style={inputStyle} placeholder="State"
                value={form.chartererState} onChange={e => update('chartererState', e.target.value)} />
            </div>
          </div>
          <div style={gridStyle}>
            <div>
              <label style={labelStyle}>Route From</label>
              <input style={inputStyle} value={form.routeFrom}
                onChange={e => update('routeFrom', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Flight No (Inbound)</label>
              <input style={inputStyle} placeholder="e.g. UAE002"
                value={form.flightNoIn} onChange={e => update('flightNoIn', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Route To</label>
              <input style={inputStyle} placeholder="e.g. EGLL"
                value={form.routeTo} onChange={e => update('routeTo', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Flight No (Outbound)</label>
              <input style={inputStyle} placeholder="e.g. UAE001"
                value={form.flightNoOut} onChange={e => update('flightNoOut', e.target.value)} />
            </div>
          </div>
        </div>

        {/* ── Section 4: Inspector Information ── */}
        <div style={sectionStyle}>
          <div style={sectionTitleStyle}>
            <User size={16} color="#00a651" /> Inspector Information
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={labelStyle}>Inspector ID</label>
              <input style={{ ...inputStyle, background: '#f8f8f8', color: '#888' }}
                value={user.inspectorId} readOnly />
            </div>
            <div>
              <label style={labelStyle}>Inspector Signature</label>
              <div style={{
                border: '1.5px solid #e0e7e0', borderRadius: '8px',
                overflow: 'hidden', background: '#fafafa',
              }}>
                <canvas
                  ref={signatureRef}
                  width={400} height={120}
                  style={{ display: 'block', width: '100%', cursor: 'crosshair' }}
                  onMouseDown={startDraw}
                  onMouseMove={draw}
                  onMouseUp={stopDraw}
                  onMouseLeave={stopDraw}
                />
                <div style={{
                  padding: '6px 12px', borderTop: '1px solid #e8e8e8',
                  display: 'flex', justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <span style={{ fontSize: '11px', color: '#aaa' }}>
                    {hasSignature ? '✅ Signature captured' : 'Draw your signature above'}
                  </span>
                  <button onClick={clearSignature} style={{
                    background: 'none', border: 'none', fontSize: '12px',
                    color: '#999', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
                  }}>Clear</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom action buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button onClick={() => router.push('/dashboard')} style={{
            padding: '11px 24px', background: '#fff',
            border: '1.5px solid #e0e0e0', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, color: '#666',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
          }}>
            Cancel
          </button>
          <button onClick={() => handleSubmit(true)} disabled={loading} style={{
            padding: '9px 20px', background: '#fff',
            border: '1.5px solid #e0e0e0', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#444',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Save size={14} /> Save Draft
          </button>
          <button onClick={() => handleSubmit(false)} disabled={loading} style={{
            padding: '9px 20px', background: '#00a651',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#fff',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
          }}>
            {loading ? 'Saving...' : <><Rocket size={14} /> Start Inspection</>}
          </button>
        </div>
      </div>
    </div>
  )
}