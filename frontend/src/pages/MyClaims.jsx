import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getMyClaims, cancelClaim } from '../api/claims'
import './Claims.css'

const STATUS_LABELS = {
  pending: '待审核', approved: '已批准', rejected: '已拒绝', cancelled: '已取消',
}

export default function MyClaims() {
  const navigate = useNavigate()
  const [claims, setClaims] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    getMyClaims()
      .then((res) => {
        if (res.code === 200) setClaims(res.data?.claims || res.data || [])
        else setError(res.message)
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel(claimId) {
    if (!window.confirm('确认取消该认领申请？')) return
    try {
      const res = await cancelClaim(claimId)
      if (res.code === 200) {
        setClaims((prev) =>
          prev.map((c) => c.id === claimId ? { ...c, status: 'cancelled' } : c)
        )
        setMessage('申请已取消')
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '取消失败')
    }
  }

  if (loading) return <div className="claims-loading">加载中...</div>

  return (
    <div className="claims-page">
      <div className="claims-header">
        <h1>我的认领申请</h1>
        <Link to="/search" className="ghost-button">继续搜索</Link>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {claims.length === 0 ? (
        <div className="claims-empty">
          <p>暂无认领申请</p>
          <Link to="/search" className="primary-button">去搜索失物</Link>
        </div>
      ) : (
        <div className="claims-list">
          {claims.map((claim) => (
            <div key={claim.id} className={`claim-card status-${claim.status}`}>
              <div className="claim-item-info">
                <Link to={`/items/${claim.item_id}`} className="claim-item-title">
                  {claim.item_title || `物品 #${claim.item_id}`}
                </Link>
                <span className="claim-time">
                  申请时间：{claim.created_at ? String(claim.created_at).slice(0, 10) : '-'}
                </span>
              </div>

              <div className="claim-details">
                {claim.description && (
                  <p><strong>申请说明：</strong>{claim.description}</p>
                )}
                {claim.proof_text && (
                  <p><strong>证明材料：</strong>{claim.proof_text}</p>
                )}
                {claim.review_comment && claim.status === 'rejected' && (
                  <p className="reject-reason"><strong>拒绝原因：</strong>{claim.review_comment}</p>
                )}
              </div>

              <div className="claim-footer">
                <span className={`badge badge-${claim.status}`}>{STATUS_LABELS[claim.status] || claim.status}</span>
                {claim.status === 'pending' && (
                  <button className="danger-button sm" onClick={() => handleCancel(claim.id)}>
                    取消申请
                  </button>
                )}
                {claim.status === 'approved' && (
                  <span className="approved-hint">请与发布者联系取回物品</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
