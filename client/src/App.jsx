import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

function App() {
  const [status, setStatus] = useState([]) // [{ label, count, lastClick }]
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const timerRef = useRef(null)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status')
      if (!res.ok) throw new Error(`Status ${res.status}`)
      const data = await res.json()
      setStatus(data.status || [])
      setError(null)
    } catch (e) {
      setError(e.message || 'Failed to fetch status')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    timerRef.current = setInterval(fetchStatus, 5000)
    return () => clearInterval(timerRef.current)
  }, [fetchStatus])

  const colorForCount = useCallback((count) => {
    if (count <= 0) return '#22c55e' // green
    if (count <= 5) return '#facc15' // yellow
    return '#ef4444' // red
  }, [])

  const handleClick = useCallback(async (label) => {
    // optimistic update
    setStatus((prev) => prev.map((b) => b.label === label ? { ...b, count: b.count + 1, lastClick: Date.now() } : b))
    try {
      const res = await fetch('/api/clicks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label })
      })
      if (!res.ok) throw new Error('Failed to record click')
    } catch (e) {
      // rollback on failure
      setStatus((prev) => prev.map((b) => b.label === label ? { ...b, count: Math.max(0, b.count - 1) } : b))
      setError(e.message || 'Failed to record click')
    }
  }, [])

  const buttons = useMemo(() => status.map(({ label, count }) => ({ label, count, color: colorForCount(count) })), [status, colorForCount])

  return (
    <div className="container">
      <h1>Status Buttons</h1>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="loading">Loading…</div>
      ) : (
        <div className="grid">
          {buttons.map(({ label, count, color }) => (
            <button
              key={label}
              className="status-button"
              style={{ backgroundColor: color }}
              onClick={() => handleClick(label)}
              aria-label={`${label}, ${count} clicks in last 4 hours`}
            >
              <span className="label">{label}</span>
              <span className="count">{count}</span>
            </button>
          ))}
        </div>
      )}
      <div className="legend">
        <div><span className="dot" style={{ backgroundColor: '#22c55e' }}></span> 0 clicks</div>
        <div><span className="dot" style={{ backgroundColor: '#facc15' }}></span> 1–5 clicks</div>
        <div><span className="dot" style={{ backgroundColor: '#ef4444' }}></span> >5 clicks</div>
      </div>
    </div>
  )
}

export default App
