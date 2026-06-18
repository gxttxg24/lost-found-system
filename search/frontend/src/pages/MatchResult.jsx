import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getItemMatches, triggerMatching } from '../api/matches'
import './MatchResult.css'

export default function MatchResult() {
  const { itemId } = useParams()
  const navigate = useNavigate()

  const [target, setTarget] = useState(null)
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [recomputing, setRecomputing] = useState(false)
  const [error, setError] = useState('')

  function loadMatches(force = false) {
    setLoading(true)
    setError('')
    getItemMatches(itemId, force)
      .then(res => {
        const d = res.data.data
        setTarget(d.target_item)
        setMatches(d.matches || [])
      })
      .catch(err => {
        setError(err.response?.data?.message || '加载失败，请稍后重试')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadMatches(false)
  }, [itemId])

  function handleRecompute() {
    const token = localStorage.getItem('token')
    if (!token) {
      // 无鉴权时直接用 force=true 参数刷新（通过查询接口）
      setRecomputing(true)
      getItemMatches(itemId, true)
        .then(res => {
          const d = res.data.data
          setTarget(d.target_item)
          setMatches(d.matches || [])
        })
        .catch(err => setError(err.response?.data?.message || '重新匹配失败'))
        .finally(() => setRecomputing(false))
      return
    }
    // 有 token 时调用 trigger 接口（需要是物品所有者）
    setRecomputing(true)
    triggerMatching(itemId)
      .then(() => loadMatches(false))
      .catch(err => {
        const msg = err.response?.data?.message || '重新匹配失败'
        setError(msg)
      })
      .finally(() => setRecomputing(false))
  }

  if (loading) {
    return (
      <div className="match-page">
        <div className="match-loading">
          <div className="spinner" />
          <p>正在计算智能匹配，请稍候…</p>
        </div>
      </div>
    )
  }

  if (error && !target) {
    return (
      <div className="match-page">
        <div className="match-error">
          <p>{error}</p>
          <button onClick={() => navigate(-1)}>返回</button>
        </div>
      </div>
    )
  }

  const oppositeLabel = target?.type === 'lost' ? '招领' : '失物'
  const typeColor = target?.type === 'lost' ? 'lost' : 'found'

  return (
    <div className="match-page">
      <div className="match-inner">
        {/* Back + title */}
        <div className="match-topbar">
          <button className="back-btn" onClick={() => navigate(-1)}>← 返回</button>
          <h1 className="match-title">智能匹配结果</h1>
        </div>

        {/* Target item */}
        <div className={`target-card ${typeColor}`}>
          <div className="target-label">
            {target?.type === 'lost' ? '失物信息' : '招领信息'}
          </div>
          <h2 className="target-title">{target?.title}</h2>
          {target?.description && (
            <p className="target-desc">{target.description}</p>
          )}
          <div className="target-meta">
            {target?.category_name && <span>📁 {target.category_name}</span>}
            {target?.location && <span>📍 {target.location}</span>}
            {target?.event_time && <span>📅 {target.event_time.slice(0, 10)}</span>}
            {target?.username && <span>👤 {target.username}</span>}
          </div>
          {target?.contact_info && (
            <div className="target-contact">联系方式：{target.contact_info}</div>
          )}
        </div>

        {/* Match header */}
        <div className="match-header">
          <div>
            <h2 className="section-title">
              疑似匹配的{oppositeLabel}信息
              <span className="match-count">共 {matches.length} 条</span>
            </h2>
            {error && <p className="inline-error">{error}</p>}
          </div>
          <button
            className="recompute-btn"
            onClick={handleRecompute}
            disabled={recomputing}
          >
            {recomputing ? '计算中…' : '重新匹配'}
          </button>
        </div>

        {/* Match list */}
        {matches.length === 0 ? (
          <div className="match-empty">
            <p>暂时没有找到匹配的{oppositeLabel}信息</p>
            <p>可以稍后再来查看，或者尝试重新匹配</p>
          </div>
        ) : (
          <div className="match-list">
            {matches.map((m, idx) => (
              <MatchCard key={m.match_id} match={m} rank={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ScoreBar({ score }) {
  const pct = Math.round(score * 100)
  const color = pct >= 70 ? '#16a34a' : pct >= 40 ? '#d97706' : '#64748b'
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div className="score-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="score-pct" style={{ color }}>{pct}%</span>
    </div>
  )
}

function MatchCard({ match, rank }) {
  const item = match.item
  const typeLabel = item.type === 'lost' ? '失物' : '招领'
  const badgeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found'

  return (
    <div className="match-card">
      <div className="match-rank">#{rank}</div>

      <div className="match-card-body">
        <div className="match-card-header">
          <span className={`badge ${badgeClass}`}>{typeLabel}</span>
          <h3 className="match-item-title">{item.title}</h3>
        </div>

        <div className="match-score-row">
          <span className="score-label">相似度</span>
          <ScoreBar score={match.similarity_score} />
        </div>

        {match.match_reason && (
          <div className="match-reason">
            <span>匹配依据：</span>{match.match_reason}
          </div>
        )}

        {item.description && (
          <p className="match-desc">
            {item.description.slice(0, 100)}
            {item.description.length > 100 ? '…' : ''}
          </p>
        )}

        <div className="match-meta">
          {item.category_name && <span>📁 {item.category_name}</span>}
          {item.location && <span>📍 {item.location}</span>}
          {item.event_time && <span>📅 {item.event_time.slice(0, 10)}</span>}
          {item.username && <span>👤 {item.username}</span>}
        </div>

        {item.contact_info && (
          <div className="match-contact">联系方式：{item.contact_info}</div>
        )}

        {item.images?.[0] && (
          <img
            src={`http://localhost:5000/${item.images[0]}`}
            alt={item.title}
            className="match-img"
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
      </div>
    </div>
  )
}
