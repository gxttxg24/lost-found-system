import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getItemClaims, approveClaim, rejectClaim } from '../api/claims'
import { getMyItems } from '../api/items'
import './Claims.css'

const STATUS_LABELS = {
  pending: '待审核', approved: '已批准', rejected: '已拒绝', cancelled: '已取消',
}

export default function ReviewClaims() {
  const navigate = useNavigate()
  const [pendingClaims, setPendingClaims] = useState([])
  const [myItems, setMyItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    getMyItems()
      .then((res) => {
        const items = res.data?.items || res.data || []
        setMyItems(items)
        return Promise.all(items.map((item) => getItemClaims(item.id)))
      })
      .then((results) => {
        const all = results.flatMap((r) => r.data?.claims || r.data || [])
        setPendingClaims(all)
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  async function handleApprove(claimId) {
    setProcessing(true)
    setError('')
    try {
      const res = await approveClaim(claimId)
      if (res.code === 200) {
        setPendingClaims((prev) =>
          prev.map((c) => c.id === claimId ? { ...c, status: 'approved' } : c)
        )
        setMessage('已批准认领申请')
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败')
    } finally {
      setProcessing(false)
    }
  }

  async function handleReject(e) {
    e.preventDefault()
    setProcessing(true)
    setError('')
    try {
      const res = await rejectClaim(rejectModal, { reason: rejectReason })
      if (res.code === 200) {
        setPendingClaims((prev) =>
          prev.map((c) => c.id === rejectModal ? { ...c, status: 'rejected' } : c)
        )
        setMessage('已拒绝该申请')
        setRejectModal(null)
        setRejectReason('')
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败')
    } finally {
      setProcessing(false)
    }
  }

  if (loading) return <div className="claims-loading">加载中...</div>

  return (
    <div className="claims-page">
      <div className="claims-header">
        <h1>审核认领申请</h1>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {pendingClaims.length === 0 ? (
        <div className="claims-empty">
          <p>暂无认领申请</p>
          <p className="claims-empty-hint">当其他用户对你的物品发起认领申请时，会显示在这里</p>
        </div>
      ) : (
        <div className="claims-list">
          {pendingClaims.map((claim) => (
            <div key={claim.id} className={`claim-card status-${claim.status}`}>
              <div className="claim-item-info">
                <Link to={`/items/${claim.item_id}`} className="claim-item-title">
                  {claim.item_title || `物品 #${claim.item_id}`}
                </Link>
                <span className="claim-time">
                  {claim.applicant_name && `申请人：${claim.applicant_name} · `}
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
              </div>

              <div className="claim-footer">
                <span className={`badge badge-${claim.status}`}>{STATUS_LABELS[claim.status] || claim.status}</span>
                {claim.status === 'pending' && (
                  <>
                    <button
                      className="primary-button sm"
                      disabled={processing}
                      onClick={() => handleApprove(claim.id)}
                    >
                      批准
                    </button>
                    <button
                      className="danger-button sm"
                      onClick={() => setRejectModal(claim.id)}
                    >
                      拒绝
                    </button>
                  </>
                )}
                {claim.claimant_contact && claim.status === 'approved' && (
                  <span className="approved-hint">联系方式：{claim.claimant_contact}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => { setRejectModal(null); setRejectReason('') }}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>拒绝认领申请</h3>
            <form onSubmit={handleReject}>
              <label>
                <span>拒绝原因（选填）</span>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  placeholder="告知申请人拒绝的原因"
                />
              </label>
              <div className="modal-actions">
                <button type="submit" className="danger-button" disabled={processing}>
                  {processing ? '处理中...' : '确认拒绝'}
                </button>
                <button type="button" className="ghost-button" onClick={() => { setRejectModal(null); setRejectReason('') }}>
                  取消
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
