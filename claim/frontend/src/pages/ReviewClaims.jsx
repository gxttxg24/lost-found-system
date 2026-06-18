import { useEffect, useState } from "react"
import { getReviewClaims, reviewClaim } from "../api/claims"

const STATUS_LABELS = {
  pending: '待审核', approved: '已通过', rejected: '已驳回', cancelled: '已取消',
}

function ReviewClaims({ onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [claims, setClaims] = useState([])
  const [statusFilter, setStatusFilter] = useState('pending')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [submittingId, setSubmittingId] = useState(null)
  const [comment, setComment] = useState('')

  const fetchData = async (targetPage = page, targetStatus = statusFilter) => {
    setLoading(true)
    setError('')
    try {
      const params = { page: targetPage, page_size: 10 }
      if (targetStatus) params.status = targetStatus
      const res = await getReviewClaims(params)
      setClaims(res.data?.claims || [])
      setPage(res.data?.page || targetPage)
      setTotalPages(res.data?.total_pages || 1)
    } catch (e) {
      setError(e.response?.data?.message || e.message || '加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => { fetchData(1, statusFilter) }, [statusFilter])

  const handleReview = async (claimId, action) => {
    setSubmittingId(claimId)
    setError('')
    try {
      const res = await reviewClaim(claimId, { action, review_comment: comment })
      setMessage(res.message || '审核已完成')
      await fetchData(page, statusFilter)
    } catch (e) {
      setError(e.response?.data?.message || e.message || '审核失败')
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <section className="page-stack">
      <section className="panel page-panel-head">
        <div>
          <h2>ReviewClaims — 审核管理</h2>
          <p>查看自己需要审核的认领申请，执行通过或驳回。</p>
        </div>
        <div className="page-actions">
          <button className="ghost-button" onClick={() => onNavigate('#/claim-center')}>返回认领中心</button>
          <button className="ghost-button" onClick={() => onNavigate('#/my-claims')}>去 MyClaims</button>
          <button className="secondary-button" onClick={() => fetchData()}>刷新</button>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      <section className="panel">
        <div className="panel-head">
          <h2>审核筛选</h2>
        </div>
        <div className="toolbar toolbar-grid">
          <label>
            <span>状态筛选</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
              <option value="">全部</option>
            </select>
          </label>
          <label className="toolbar-comment">
            <span>审核意见</span>
            <input
              type="text"
              placeholder="通过审核 / 证据不足"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </label>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>申请列表</h2>
          <p>共 {claims.length} 条 · 第 {page}/{totalPages || 1} 页</p>
        </div>

        {loading ? <div className="empty-state">加载中...</div> : null}
        {!loading && claims.length === 0 ? <div className="empty-state">没有符合条件的申请</div> : null}

        <div className="card-list review-list">
          {claims.map((c) => (
            <article key={c.id} className="claim-card review-card">
              <header>
                <div>
                  <h3>{c.item_title}</h3>
                  <p>申请人：{c.applicant_name} · 物主：{c.owner_name}</p>
                </div>
                <span className={`badge badge-${c.status}`}>{STATUS_LABELS[c.status] || c.status}</span>
              </header>

              <div className="detail-grid">
                <div><span>认领说明</span><p>{c.description || '无'}</p></div>
                <div><span>证明材料</span><p>{c.proof_text || '无'}</p></div>
              </div>

              <p>申请时间：{c.created_at} · 更新：{c.updated_at}</p>
              {c.review_comment ? <p>审核备注：{c.review_comment}</p> : null}

              {c.status === 'pending' ? (
                <div className="action-row">
                  <button className="primary-button" disabled={submittingId === c.id}
                    onClick={() => handleReview(c.id, 'approve')}>
                    {submittingId === c.id ? '处理中...' : '通过'}
                  </button>
                  <button className="danger-button" disabled={submittingId === c.id}
                    onClick={() => handleReview(c.id, 'reject')}>
                    {submittingId === c.id ? '处理中...' : '驳回'}
                  </button>
                </div>
              ) : (
                <div className="review-finished">该申请已处理</div>
              )}
            </article>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="action-row" style={{ marginTop: 16, justifyContent: 'center' }}>
            <button className="ghost-button" disabled={page <= 1} onClick={() => fetchData(page - 1)}>上一页</button>
            <span style={{ padding: '0 16px', alignSelf: 'center' }}>{page} / {totalPages}</span>
            <button className="ghost-button" disabled={page >= totalPages} onClick={() => fetchData(page + 1)}>下一页</button>
          </div>
        )}
      </section>
    </section>
  )
}

export default ReviewClaims
