import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { getItem, deleteItem, updateItem } from '../api/items'
import { createClaim } from '../api/claims'
import './ItemDetail.css'

const BASE_URL = 'http://localhost:5000'

const STATUS_LABELS = {
  open: '寻找中', matching: '匹配中', claimed: '已认领', closed: '已关闭',
}
const TYPE_LABELS = { lost: '失物', found: '招领' }

export default function ItemDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [claimModal, setClaimModal] = useState(false)
  const [claimForm, setClaimForm] = useState({ description: '', proof_text: '' })
  const [claiming, setClaiming] = useState(false)

  const currentUser = (() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })()

  useEffect(() => {
    setLoading(true)
    getItem(id)
      .then((res) => {
        if (res.code === 200) setItem(res.data)
        else setError(res.message)
      })
      .catch(() => setError('加载失败'))
      .finally(() => setLoading(false))
  }, [id])

  async function handleDelete() {
    if (!window.confirm('确认删除该信息？')) return
    try {
      await deleteItem(id)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || '删除失败')
    }
  }

  async function handleClose() {
    if (!window.confirm('确认关闭该信息？关闭后不可再认领。')) return
    try {
      const res = await updateItem(id, { status: 'closed' })
      if (res.code === 200) {
        setItem((prev) => ({ ...prev, status: 'closed' }))
        setMessage('信息已关闭')
      }
    } catch (err) {
      setError(err.response?.data?.message || '操作失败')
    }
  }

  async function handleClaim(e) {
    e.preventDefault()
    setClaiming(true)
    setError('')
    try {
      const res = await createClaim({
        item_id: Number(id),
        description: claimForm.description,
        proof_text: claimForm.proof_text,
      })
      if (res.code === 200) {
        setMessage('认领申请已提交，等待物主审核')
        setClaimModal(false)
        setClaimForm({ description: '', proof_text: '' })
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '申请失败')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) return <div className="detail-loading">加载中...</div>
  if (error && !item) return (
    <div className="detail-error">
      <p>{error}</p>
      <button className="ghost-button" onClick={() => navigate(-1)}>返回</button>
    </div>
  )
  if (!item) return null

  const isOwner = currentUser && currentUser.id === item.user_id
  const canClaim = currentUser && !isOwner && item.status !== 'claimed' && item.status !== 'closed'

  return (
    <div className="detail-page">
      <div className="detail-inner">
        <button className="back-btn ghost-button" onClick={() => navigate(-1)}>← 返回</button>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        <div className={`detail-card type-${item.type}`}>
          <div className="detail-top">
            <span className={`badge badge-${item.type}`}>{TYPE_LABELS[item.type]}</span>
            <span className={`status-tag status-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</span>
          </div>

          <h1 className="detail-title">{item.title}</h1>

          {item.images?.length > 0 && (
            <div className="detail-images">
              {item.images.map((src, i) => (
                <img
                  key={i}
                  src={`${BASE_URL}/${src}`}
                  alt={item.title}
                  className="detail-img"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
              ))}
            </div>
          )}

          {item.description && (
            <p className="detail-desc">{item.description}</p>
          )}

          <div className="detail-meta">
            {item.category_name && <div><span>分类</span><p>📁 {item.category_name}</p></div>}
            {item.location && <div><span>地点</span><p>📍 {item.location}</p></div>}
            {item.event_time && <div><span>时间</span><p>📅 {item.event_time.slice(0, 16)}</p></div>}
            {item.contact_info && <div><span>联系方式</span><p>📞 {item.contact_info}</p></div>}
            {item.username && <div><span>发布者</span><p>👤 {item.username}</p></div>}
            <div><span>浏览次数</span><p>👁 {item.view_count || 0}</p></div>
          </div>

          <div className="detail-actions">
            <Link to={`/matches/${item.id}`} className="primary-button">智能匹配</Link>

            {canClaim && (
              <button
                className="ghost-button"
                onClick={() => {
                  if (!localStorage.getItem('token')) { navigate('/login'); return }
                  setClaimModal(true)
                }}
              >
                申请认领
              </button>
            )}

            {isOwner && (
              <>
                <button className="ghost-button" onClick={() => navigate(`/items/${id}/edit`)}>编辑</button>
                {item.status !== 'closed' && (
                  <button className="secondary-button" onClick={handleClose}>关闭信息</button>
                )}
                <button className="danger-button" onClick={handleDelete}>删除</button>
              </>
            )}
          </div>
        </div>

        {/* Claim modal */}
        {claimModal && (
          <div className="modal-overlay" onClick={() => setClaimModal(false)}>
            <div className="modal-box" onClick={(e) => e.stopPropagation()}>
              <h3>发起认领申请</h3>
              <form onSubmit={handleClaim}>
                <label>
                  <span>认领说明</span>
                  <textarea
                    value={claimForm.description}
                    onChange={(e) => setClaimForm((p) => ({ ...p, description: e.target.value }))}
                    rows={3}
                    placeholder="说明你认为这是你的物品的原因"
                  />
                </label>
                <label>
                  <span>证明材料（文字描述）</span>
                  <textarea
                    value={claimForm.proof_text}
                    onChange={(e) => setClaimForm((p) => ({ ...p, proof_text: e.target.value }))}
                    rows={3}
                    placeholder="如：手机品牌型号、书上写的名字等"
                  />
                </label>
                <div className="modal-actions">
                  <button type="submit" className="primary-button" disabled={claiming}>
                    {claiming ? '提交中...' : '提交申请'}
                  </button>
                  <button type="button" className="ghost-button" onClick={() => setClaimModal(false)}>
                    取消
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
