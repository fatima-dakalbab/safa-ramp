'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft, ChevronDown, ChevronUp,
  CheckCircle2, XCircle, Minus, AlertTriangle,
  Send, Save, Plus
} from 'lucide-react'

interface ChecklistItem {
  id: string
  code: string
  category: string
  description: string
  standard: string
}

interface Finding {
  itemCode: string
  status: 'PASS' | 'FAIL' | 'NOT_CHECKED'
  actionLevel?: string
  remarks?: string
}

interface Inspection {
  id: string
  poiNumber: string
  place: string
  status: string
  aircraft?: { registration: string; typeModel: string }
  operator?: { airlineName: string }
}

const CATEGORIES = [
  { key: 'A', label: 'A - Flight Deck', color: '#7c3aed' },
  { key: 'B', label: 'B - Cabin', color: '#0891b2' },
  { key: 'C', label: 'C - Aircraft Condition', color: '#d97706' },
  { key: 'D', label: 'D - Cargo', color: '#dc2626' },
  { key: 'E', label: 'E - General', color: '#16a34a' },
]

const ACTION_LEVELS = [
  { value: 'CAT1', label: 'CAT 1 — Information only', color: '#16a34a' },
  { value: 'CAT2', label: 'CAT 2 — Information to Authority', color: '#d97706' },
  { value: 'CAT3A', label: 'CAT 3A — Restriction on operation', color: '#dc2626' },
  { value: 'CAT3B', label: 'CAT 3B — Corrective actions before flight', color: '#dc2626' },
  { value: 'CAT3C', label: 'CAT 3C — Aircraft grounded by UAE GCAA', color: '#7c2d12' },
  { value: 'CAT3D', label: 'CAT 3D — Immediate Operating Ban', color: '#7c2d12' },
]

// Default checklist items per category
const DEFAULT_ITEMS: Record<string, { code: string; description: string; standard: string }[]> = {
  A: [
    { code: 'A01', description: 'General Condition of Flight Deck', standard: 'Annex 6 Part I, 6.1' },
    { code: 'A02', description: 'Emergency Exit accessibility', standard: 'Annex 6 Part I, 6.2' },
    { code: 'A03', description: 'Flight crew documentation & licenses', standard: 'Annex 2, 2.3' },
    { code: 'A04', description: 'Flight crew competency & recency', standard: 'Annex 1, 2.1' },
    { code: 'A05', description: 'Navigation charts & publications', standard: 'Annex 6 Part I, 4.3' },
    { code: 'A06', description: 'MEL/CDL compliance', standard: 'Annex 6 Part I, 6.13' },
    { code: 'A07', description: 'Flight crew duty time & rest', standard: 'Annex 6 Part I, 4.10' },
    { code: 'A08', description: 'Aircraft journey log', standard: 'Annex 6 Part I, 11.4' },
  ],
  B: [
    { code: 'B01', description: 'Cabin crew documentation & licenses', standard: 'Annex 6 Part I, 12.4' },
    { code: 'B02', description: 'Cabin crew safety training', standard: 'Annex 6 Part I, 12.4' },
    { code: 'B03', description: 'Emergency equipment accessibility', standard: 'Annex 6 Part I, 6.2' },
    { code: 'B04', description: 'Seats, seatbelts & harnesses', standard: 'Annex 6 Part I, 6.5' },
    { code: 'B05', description: 'Emergency exits & markings', standard: 'Annex 6 Part I, 6.2' },
    { code: 'B06', description: 'Oxygen system', standard: 'Annex 6 Part I, 6.8' },
    { code: 'B07', description: 'First aid kit', standard: 'Annex 6 Part I, 6.2' },
    { code: 'B08', description: 'Passenger briefing & safety cards', standard: 'Annex 6 Part I, 4.6' },
  ],
  C: [
    { code: 'C01', description: 'General aircraft condition (exterior)', standard: 'Annex 8, Part II' },
    { code: 'C02', description: 'Aircraft registration & markings', standard: 'Annex 7, 3' },
    { code: 'C03', description: 'Airworthiness certificate', standard: 'Annex 8, 4.2' },
    { code: 'C04', description: 'Noise certificate', standard: 'Annex 16, Vol I' },
    { code: 'C05', description: 'Engine condition (visible)', standard: 'Annex 8, Part II' },
    { code: 'C06', description: 'Landing gear & doors', standard: 'Annex 8, Part II' },
    { code: 'C07', description: 'Windows & windshields', standard: 'Annex 8, Part II' },
    { code: 'C08', description: 'Lights (navigation, landing, strobe)', standard: 'Annex 2, 3.5' },
  ],
  D: [
    { code: 'D01', description: 'Cargo documentation', standard: 'Annex 18, 5.1' },
    { code: 'D02', description: 'Dangerous goods compliance', standard: 'Annex 18, 4.1' },
    { code: 'D03', description: 'Cargo loading & securing', standard: 'Annex 6 Part I, 5.4' },
    { code: 'D04', description: 'Cargo compartment condition', standard: 'Annex 6 Part I, 5.4' },
    { code: 'D05', description: 'Weight & balance documentation', standard: 'Annex 6 Part I, 4.3' },
  ],
  E: [
    { code: 'E01', description: 'Aircraft insurance certificate', standard: 'ICAO Doc 9587' },
    { code: 'E02', description: 'Air operator certificate (AOC)', standard: 'Annex 6 Part I, 4.2' },
    { code: 'E03', description: 'Radio station license', standard: 'Annex 10, Vol II' },
    { code: 'E04', description: 'Operations manual availability', standard: 'Annex 6 Part I, 4.2' },
    { code: 'E05', description: 'Security programme compliance', standard: 'Annex 17, 3.1' },
  ],
}

export default function ChecklistPage() {
  const router = useRouter()
  const params = useParams()
  const inspectionId = params.id as string

  const [inspection, setInspection] = useState<Inspection | null>(null)
  const [findings, setFindings] = useState<Record<string, Finding>>({})
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({ A: true })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token')
    if (!token) { router.push('/'); return }
    fetchInspection(token)
  }, [inspectionId])

  async function fetchInspection(token: string) {
    try {
      const res = await fetch(`/api/inspections/${inspectionId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!res.ok) { router.push('/dashboard'); return }
      const data = await res.json()
      setInspection(data.inspection)
    } catch (e) {
      console.error(e)
    }
  }

  function toggleCategory(cat: string) {
    setExpandedCategories(prev => ({ ...prev, [cat]: !prev[cat] }))
  }

  function setFindingStatus(code: string, status: 'PASS' | 'FAIL' | 'NOT_CHECKED') {
    setFindings(prev => ({
      ...prev,
      [code]: { ...prev[code], itemCode: code, status }
    }))
  }

  function setFindingDetail(code: string, field: string, value: string) {
    setFindings(prev => ({
      ...prev,
      [code]: { ...prev[code], itemCode: code, [field]: value }
    }))
  }

  function getProgress() {
    const allItems = Object.values(DEFAULT_ITEMS).flat()
    const checked = allItems.filter(item =>
      findings[item.code] && findings[item.code].status !== 'NOT_CHECKED'
    ).length
    return { checked, total: allItems.length }
  }

  async function handleSave(submit: boolean) {
    setSaving(true)
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token')
      const findingsArray = Object.values(findings).filter(f => f.status !== 'NOT_CHECKED')

      const res = await fetch(`/api/inspections/${inspectionId}/findings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ findings: findingsArray, submit }),
      })

      if (!res.ok) return
      if (submit) {
        router.push(`/inspection/${inspectionId}/summary`)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  const progress = getProgress()
  const findingsCount = Object.values(findings).filter(f => f.status === 'FAIL').length

  if (!inspection) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'DM Sans, sans-serif' }}>
      <div style={{ color: '#64748b' }}>Loading inspection...</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8faf8', fontFamily: 'DM Sans, sans-serif' }}>

      {/* Navbar */}
      <nav style={{
        background: '#fff', borderBottom: '1px solid #e2e8f0',
        padding: '0 32px', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'sticky', top: 0, zIndex: 10,
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
          <img src="/toplogo.png" alt="GCAA" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1a1a1a' }}>
              Inspection Checklist
            </div>
            <div style={{ fontSize: '11px', color: '#00a651', fontWeight: 600 }}>
              {inspection.poiNumber} · {inspection.aircraft?.registration || '—'} · {inspection.operator?.airlineName || '—'}
            </div>
          </div>
        </div>

        {/* Progress + actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Progress bar */}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
              {progress.checked} / {progress.total} items checked
            </div>
            <div style={{ width: '160px', height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
              <div style={{
                width: `${(progress.checked / progress.total) * 100}%`,
                height: '100%', background: '#00a651', borderRadius: '99px',
                transition: 'width 0.3s',
              }} />
            </div>
          </div>

          {findingsCount > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#fef2f2', border: '1px solid #fecaca',
              borderRadius: '8px', padding: '6px 12px',
            }}>
              <AlertTriangle size={14} color="#dc2626" />
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#dc2626' }}>
                {findingsCount} finding{findingsCount > 1 ? 's' : ''}
              </span>
            </div>
          )}

          <button onClick={() => handleSave(false)} disabled={saving} style={{
            padding: '9px 16px', background: '#fff',
            border: '1.5px solid #e0e0e0', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#444',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Save size={14} /> Save
          </button>

          <button onClick={() => handleSave(true)} disabled={saving} style={{
            padding: '9px 16px', background: '#00a651',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', fontWeight: 600, color: '#fff',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
          }}>
            <Send size={14} /> Submit Inspection
          </button>
        </div>
      </nav>

      {/* Checklist */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {CATEGORIES.map(cat => {
          const items = DEFAULT_ITEMS[cat.key] || []
          const isExpanded = expandedCategories[cat.key]
          const catFindings = items.filter(i => findings[i.code]?.status === 'FAIL').length
          const catChecked = items.filter(i => findings[i.code]?.status !== undefined && findings[i.code]?.status !== 'NOT_CHECKED').length

          return (
            <div key={cat.key} style={{
              background: '#fff', border: '1.5px solid #e2e8f0',
              borderRadius: '14px', marginBottom: '12px',
              overflow: 'hidden',
            }}>
              {/* Category header */}
              <button
                onClick={() => toggleCategory(cat.key)}
                style={{
                  width: '100%', padding: '16px 20px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  fontFamily: 'DM Sans, sans-serif',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: `${cat.color}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '14px', fontWeight: 700, color: cat.color,
                  }}>
                    {cat.key}
                  </div>
                  <span style={{ fontSize: '15px', fontWeight: 600, color: '#1a1a1a' }}>
                    {cat.label}
                  </span>
                  {catFindings > 0 && (
                    <span style={{
                      background: '#fef2f2', color: '#dc2626',
                      border: '1px solid #fecaca',
                      padding: '2px 8px', borderRadius: '99px',
                      fontSize: '11px', fontWeight: 700,
                    }}>
                      {catFindings} finding{catFindings > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {catChecked}/{items.length}
                  </span>
                  {isExpanded
                    ? <ChevronUp size={16} color="#94a3b8" />
                    : <ChevronDown size={16} color="#94a3b8" />
                  }
                </div>
              </button>

              {/* Items */}
              {isExpanded && (
                <div style={{ borderTop: '1px solid #f1f5f9' }}>
                  {items.map((item, idx) => {
                    const finding = findings[item.code]
                    const isFail = finding?.status === 'FAIL'
                    const isPass = finding?.status === 'PASS'

                    return (
                      <div key={item.code} style={{
                        padding: '16px 20px',
                        borderBottom: idx < items.length - 1 ? '1px solid #f8fafc' : 'none',
                        background: isFail ? '#fff8f8' : 'transparent',
                      }}>
                        {/* Item row */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                          {/* Code badge */}
                          <div style={{
                            minWidth: '40px', height: '24px', borderRadius: '6px',
                            background: `${cat.color}15`, display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: 700, color: cat.color,
                            marginTop: '2px',
                          }}>
                            {item.code}
                          </div>

                          {/* Description */}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '14px', color: '#1a1a1a', fontWeight: 500, marginBottom: '2px' }}>
                              {item.description}
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                              {item.standard}
                            </div>
                          </div>

                          {/* Status buttons */}
                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px' }}>
                            <StatusBtn
                              active={isPass}
                              color="#16a34a"
                              activeBg="#dcfce7"
                              onClick={() => setFindingStatus(item.code, isPass ? 'NOT_CHECKED' : 'PASS')}
                              icon={<CheckCircle2 size={14} />}
                              label="Pass"
                            />
                            <StatusBtn
                              active={isFail}
                              color="#dc2626"
                              activeBg="#fef2f2"
                              onClick={() => setFindingStatus(item.code, isFail ? 'NOT_CHECKED' : 'FAIL')}
                              icon={<XCircle size={14} />}
                              label="Finding"
                            />
                            <StatusBtn
                              active={finding?.status === 'NOT_CHECKED' || !finding}
                              color="#94a3b8"
                              activeBg="#f1f5f9"
                              onClick={() => setFindingStatus(item.code, 'NOT_CHECKED')}
                              icon={<Minus size={14} />}
                              label="N/C"
                            />
                          </div>
                        </div>

                        {/* Finding details — only show when FAIL */}
                        {isFail && (
                          <div style={{
                            marginTop: '12px', marginLeft: '52px',
                            padding: '14px', background: '#fff',
                            border: '1px solid #fecaca', borderRadius: '10px',
                          }}>
                            <div style={{ marginBottom: '10px' }}>
                              <label style={{
                                display: 'block', fontSize: '11px', fontWeight: 600,
                                color: '#64748b', textTransform: 'uppercase',
                                letterSpacing: '0.5px', marginBottom: '6px',
                              }}>
                                Action Level
                              </label>
                              <select
                                value={finding?.actionLevel || ''}
                                onChange={e => setFindingDetail(item.code, 'actionLevel', e.target.value)}
                                style={{
                                  width: '100%', padding: '8px 12px',
                                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                                  fontSize: '13px', color: '#1a1a1a',
                                  fontFamily: 'DM Sans, sans-serif', outline: 'none',
                                  background: '#fff',
                                }}
                              >
                                <option value="">Select action level...</option>
                                {ACTION_LEVELS.map(a => (
                                  <option key={a.value} value={a.value}>{a.label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label style={{
                                display: 'block', fontSize: '11px', fontWeight: 600,
                                color: '#64748b', textTransform: 'uppercase',
                                letterSpacing: '0.5px', marginBottom: '6px',
                              }}>
                                Remarks
                              </label>
                              <textarea
                                value={finding?.remarks || ''}
                                onChange={e => setFindingDetail(item.code, 'remarks', e.target.value)}
                                placeholder="Describe the finding in detail..."
                                rows={3}
                                style={{
                                  width: '100%', padding: '8px 12px',
                                  border: '1.5px solid #e2e8f0', borderRadius: '8px',
                                  fontSize: '13px', color: '#1a1a1a',
                                  fontFamily: 'DM Sans, sans-serif', outline: 'none',
                                  resize: 'vertical', boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}

        {/* Bottom submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button onClick={() => handleSave(false)} disabled={saving} style={{
            padding: '11px 24px', background: '#fff',
            border: '1.5px solid #00a651', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, color: '#00a651',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
          }}>
            <Save size={15} /> Save Progress
          </button>
          <button onClick={() => handleSave(true)} disabled={saving} style={{
            padding: '11px 24px', background: '#00a651',
            border: 'none', borderRadius: '8px',
            fontSize: '14px', fontWeight: 600, color: '#fff',
            cursor: 'pointer', fontFamily: 'DM Sans, sans-serif',
            display: 'flex', alignItems: 'center', gap: '6px',
            boxShadow: '0 2px 8px rgba(0,166,81,0.3)',
          }}>
            <Send size={15} /> Submit Inspection
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusBtn({ active, color, activeBg, onClick, icon, label }: {
  active: boolean
  color: string
  activeBg: string
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '5px 10px', borderRadius: '6px', cursor: 'pointer',
        border: `1.5px solid ${active ? color : '#e2e8f0'}`,
        background: active ? activeBg : '#fff',
        color: active ? color : '#94a3b8',
        fontSize: '12px', fontWeight: 600,
        display: 'flex', alignItems: 'center', gap: '4px',
        fontFamily: 'DM Sans, sans-serif',
        transition: 'all 0.15s',
      }}
    >
      {icon} {label}
    </button>
  )
}