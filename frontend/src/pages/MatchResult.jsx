import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getMatchResults, triggerMatch } from '../api/matches'
import './MatchResult.css'

const BASE_URL = 'http://localhost:5000'

export default function MatchResult() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [targetItem, setTargetItem] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadMatches()
  }, [id])

  async function loadMatches() {
    setLoading(true)
    setError('')
    try {
      const res = await getMatchResults(id)
      if (res.code === 200) {
        setTargetItem(res.data?.target_item || null)
        setMatches(res.data?.matches || [])
      } else {
        setError(res.message)
      }
    } catch {
      setError('加载失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleTrigger() {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    setTriggering(true)
    setError('')
    setMessage('')
    try {
      const res = await triggerMatch(id)
      if (res.code === 200) {
        setMessage(`匹配完成，找到 ${res.data?.matched_count ?? 0} 个相似物品`)
        await loadMatches()
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '匹配失败')
    } finally {
      setTriggering(false)
    }
  }

  if (loading) return <div className="match-loading">加载中...</div>

  return (
    <div className="match-page">
      <div className="match-inner">
        <button className="ghost-button back-btn" onClick={() => navigate(-1)}>← 返回</button>

        {targetItem && (
          <div className="target-item-card">
            <div className="target-label">正在为以下物品寻找匹配</div>
            <h2>{targetItem.title}</h2>
            <div className="target-meta">
              {targetItem.category_name && <span>📁 {targetItem.category_name}</span>}
              {targetItem.location && <span>📍 {targetItem.location}</span>}
              {targetItem.event_time && <span>📅 {targetItem.event_time.slice(0, 10)}</span>}
            </div>
          </div>
        )}

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className="match-actions">
          <button className="primary-button" onClick={handleTrigger} disabled={triggering}>
            {triggering ? '匹配中...' : '重新执行智能匹配'}
          </button>
        </div>

        {matches.length === 0 ? (
          <div className="match-empty">
            <p>暂无匹配结果，点击上方按钮执行智能匹配</p>
          </div>
        ) : (
          <div className="match-list">
            <div className="match-list-header">
              <h3>匹配结果</h3>
              <span>{matches.length} 个相似物品</span>
            </div>
            {matches.map((match) => (
              <MatchCard key={match.match_id} match={match} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#94a3b8'
  return (
    <div className="score-bar-wrap">
      <div className="score-track">
        <div className="score-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

function MatchCard({ match }) {
  // Backend returns: { match_id, similarity_score, match_reason, item: {...} }
  const item = match.item || {}
  const score = match.similarity_score || 0
  const typeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found'
  const typeLabel = item.type === 'lost' ? '失物' : '招领'

  return (
    <Link to={`/items/${item.id}`} className="match-card">
      {item.images?.[0] && (
        <img
          src={`${BASE_URL}/${item.images[0]}`}
          alt={item.title}
          className="match-thumb"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="match-body">
        <div className="match-top">
          <span className={`badge ${typeClass}`}>{typeLabel}</span>
          {item.category_name && <span className="cat-tag">{item.category_name}</span>}
        </div>
        <h4 className="match-title">{item.title}</h4>
        {item.description && (
          <p className="match-desc">{item.description.slice(0, 60)}...</p>
        )}
        <div className="match-footer">
          {item.location && <span>📍 {item.location}</span>}
          {item.event_time && <span>📅 {item.event_time.slice(0, 10)}</span>}
        </div>
        {match.match_reason && (
          <p className="match-reason">💡 {match.match_reason}</p>
        )}
      </div>
      <div className="match-score-col">
        <span className="score-label">相似度</span>
        <ScoreBar score={score} />
      </div>
    </Link>
  )
}
