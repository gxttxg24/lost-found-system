import { useEffect, useState } from "react"
import { getMyClaims, cancelClaim } from "../api/claims"

const STATUS_LABELS = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已驳回",
  cancelled: "已取消",
}

function MyClaims({ onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [claims, setClaims] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [cancellingId, setCancellingId] = useState(null)

  const fetchData = async (targetPage = page) => {
    setLoading(true)
    setError("")
    try {
      const res = await getMyClaims({ page: targetPage, page_size: 10 })
      setClaims(res.data?.claims || [])
      setPage(res.data?.page || targetPage)
      setTotalPages(res.data?.total_pages || 1)
    } catch (e) {
      setError(e.response?.data?.message || e.message || "加载失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCancel = async (claimId) => {
    if (!window.confirm("确定取消这条认领申请？")) return
    setCancellingId(claimId)
    try {
      const res = await cancelClaim(claimId)
      setMessage(res.message || "已取消")
      await fetchData(page)
    } catch (e) {
      setError(e.response?.data?.message || e.message || "取消失败")
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <section className="page-stack">
      {/* ---- 顶部 ---- */}
      <section className="panel page-panel-head">
        <div>
          <h2>MyClaims — 我的认领申请</h2>
          <p>查看自己提交的每一条认领申请的处理状态与审核意见。</p>
        </div>
        <div className="page-actions">
          <button className="ghost-button" onClick={() => onNavigate("#/claim-center")}>
            返回认领中心
          </button>
          <button className="ghost-button" onClick={() => onNavigate("#/review-claims")}>
            去 ReviewClaims
          </button>
          <button className="secondary-button" onClick={() => fetchData()}>
            刷新
          </button>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      {/* ---- 列表 ---- */}
      <section className="panel">
        <div className="panel-head">
          <h2>申请列表</h2>
          <p>共 {claims.length} 条 · 第 {page}/{totalPages || 1} 页</p>
        </div>

        {loading ? (
          <div className="empty-state">正在加载...</div>
        ) : claims.length === 0 ? (
          <div className="empty-state">你还没有提交认领申请</div>
        ) : (
          <div className="card-list">
            {claims.map((c) => (
              <article key={c.id} className="claim-card">
                <header>
                  <div>
                    <h3>{c.item_title}</h3>
                    <p>申请编号 #{c.id} · 物品状态：{STATUS_LABELS[c.item_status] || c.item_status} · {c.created_at}</p>
                  </div>
                  <span className={`badge badge-${c.status}`}>{STATUS_LABELS[c.status] || c.status}</span>
                </header>

                <div className="detail-grid">
                  <div>
                    <span>认领说明</span>
                    <p>{c.description || "无"}</p>
                  </div>
                  <div>
                    <span>证明材料</span>
                    <p>{c.proof_text || "无"}</p>
                  </div>
                </div>

                <p>审核意见：{c.review_comment || "暂无"}</p>
                <small>物品归属：{c.owner_name || "未知"} · 更新于 {c.updated_at}</small>

                {c.status === "pending" && (
                  <div className="action-row" style={{ marginTop: 12 }}>
                    <button
                      className="danger-button"
                      disabled={cancellingId === c.id}
                      onClick={() => handleCancel(c.id)}
                    >
                      {cancellingId === c.id ? "取消中..." : "取消申请"}
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="action-row" style={{ marginTop: 16, justifyContent: "center" }}>
            <button className="ghost-button" disabled={page <= 1} onClick={() => fetchData(page - 1)}>
              上一页
            </button>
            <span style={{ padding: "0 16px", alignSelf: "center" }}>{page} / {totalPages}</span>
            <button className="ghost-button" disabled={page >= totalPages} onClick={() => fetchData(page + 1)}>
              下一页
            </button>
          </div>
        )}
      </section>
    </section>
  )
}

export default MyClaims
