import { useEffect, useState } from "react"
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearNotifications,
} from "../api/claims"

function Notifications({ onNavigate }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [notifs, setNotifs] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionLoading, setActionLoading] = useState(null)

  const fetchData = async (targetPage = page) => {
    setLoading(true)
    setError("")
    try {
      const [notifRes, countRes] = await Promise.all([
        getNotifications({ page: targetPage, page_size: 10 }),
        getUnreadCount(),
      ])
      setNotifs(notifRes.data?.notifications || [])
      setTotalPages(notifRes.data?.total_pages || 1)
      setPage(notifRes.data?.page || targetPage)
      setUnreadCount(countRes.data?.unread_count || 0)
    } catch (e) {
      setError(e.response?.data?.message || e.message || "加载失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleMarkRead = async (id) => {
    setActionLoading(id)
    try {
      await markAsRead(id)
      setNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      setMessage("已标记为已读")
    } catch (e) {
      setError(e.response?.data?.message || "操作失败")
    } finally {
      setActionLoading(null)
    }
  }

  const handleMarkAllRead = async () => {
    setActionLoading("all")
    try {
      const res = await markAllAsRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      setMessage(res.message || "已全部标记为已读")
    } catch (e) {
      setError(e.response?.data?.message || "操作失败")
    } finally {
      setActionLoading(null)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm("确定删除这条通知？")) return
    setActionLoading(id)
    try {
      await deleteNotification(id)
      setNotifs((prev) => prev.filter((n) => n.id !== id))
      setMessage("通知已删除")
      // 如果删除的是未读的，更新未读数
      await getUnreadCount().then((res) =>
        setUnreadCount(res.data?.unread_count || 0)
      )
    } catch (e) {
      setError(e.response?.data?.message || "删除失败")
    } finally {
      setActionLoading(null)
    }
  }

  const handleClearAll = async () => {
    if (!window.confirm("确定清空全部通知？此操作不可撤销。")) return
    setActionLoading("clear")
    try {
      const res = await clearNotifications()
      setNotifs([])
      setUnreadCount(0)
      setMessage(res.message || "已清空")
    } catch (e) {
      setError(e.response?.data?.message || "操作失败")
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <section className="page-stack">
      {/* ---- 顶部导航 ---- */}
      <section className="panel page-panel-head">
        <div>
          <h2>Notifications — 消息通知</h2>
          <p>查看认领审核结果通知、处理提醒等系统消息。</p>
        </div>
        <div className="page-actions">
          <button className="ghost-button" onClick={() => onNavigate("#/claim-center")}>
            返回认领中心
          </button>
          <button className="secondary-button" onClick={() => fetchData()}>
            刷新
          </button>
        </div>
      </section>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {message ? <div className="alert alert-success">{message}</div> : null}

      {/* ---- 快捷操作 ---- */}
      <section className="panel">
        <div className="inline-filters">
          <div className="inline-summary">
            <span>未读通知</span>
            <strong>{unreadCount} 条</strong>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="ghost-button"
              disabled={actionLoading === "all" || unreadCount === 0}
              onClick={handleMarkAllRead}
            >
              {actionLoading === "all" ? "处理中..." : "全部已读"}
            </button>
            <button
              className="danger-button"
              disabled={actionLoading === "clear" || notifs.length === 0}
              onClick={handleClearAll}
            >
              {actionLoading === "clear" ? "清空中..." : "清空全部"}
            </button>
          </div>
        </div>
      </section>

      {/* ---- 通知列表 ---- */}
      <section className="panel">
        <div className="panel-head">
          <h2>通知列表</h2>
          <p>
            共 {notifs.length} 条 · 第 {page}/{totalPages || 1} 页
          </p>
        </div>

        {loading ? (
          <div className="empty-state">正在加载通知...</div>
        ) : notifs.length === 0 ? (
          <div className="empty-state">暂无通知</div>
        ) : (
          <div className="card-list">
            {notifs.map((n) => (
              <article
                key={n.id}
                className="claim-card"
                style={
                  !n.is_read
                    ? {
                        borderLeft: "4px solid #6d4aff",
                        background: "rgba(123,92,243,0.04)",
                      }
                    : {}
                }
              >
                <header>
                  <div>
                    <h3>{n.title}</h3>
                    <p>{n.created_at}</p>
                  </div>
                  {!n.is_read && (
                    <span className="badge badge-pending">未读</span>
                  )}
                </header>

                <p style={{ margin: "10px 0", lineHeight: 1.7 }}>
                  {n.content || "无内容"}
                </p>

                <div className="action-row">
                  {!n.is_read && (
                    <button
                      className="primary-button"
                      disabled={actionLoading === n.id}
                      onClick={() => handleMarkRead(n.id)}
                    >
                      {actionLoading === n.id ? "..." : "标记已读"}
                    </button>
                  )}
                  <button
                    className="danger-button"
                    disabled={actionLoading === n.id}
                    onClick={() => handleDelete(n.id)}
                  >
                    {actionLoading === n.id ? "..." : "删除"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div
            className="action-row"
            style={{ marginTop: 16, justifyContent: "center" }}
          >
            <button
              className="ghost-button"
              disabled={page <= 1}
              onClick={() => fetchData(page - 1)}
            >
              上一页
            </button>
            <span style={{ padding: "0 16px", alignSelf: "center" }}>
              {page} / {totalPages}
            </span>
            <button
              className="ghost-button"
              disabled={page >= totalPages}
              onClick={() => fetchData(page + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </section>
    </section>
  )
}

export default Notifications
