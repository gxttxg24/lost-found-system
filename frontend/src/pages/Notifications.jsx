import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { getNotifications, markNotificationRead, markAllRead } from '../api/claims'
import './Notifications.css'

export default function Notifications() {
  const navigate = useNavigate()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    getNotifications()
      .then((res) => {
        if (res.code === 200) setNotifications(res.data?.notifications || res.data || [])
        else setError(res.message)
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  async function handleMarkRead(id) {
    try {
      await markNotificationRead(id)
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch { /* ignore */ }
  }

  async function handleMarkAll() {
    try {
      await markAllRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    } catch { /* ignore */ }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  if (loading) return <div className="notifs-loading">加载中...</div>

  return (
    <div className="notifs-page">
      <div className="notifs-header">
        <h1>
          通知消息
          {unreadCount > 0 && <span className="unread-chip">{unreadCount} 条未读</span>}
        </h1>
        {unreadCount > 0 && (
          <button className="ghost-button" onClick={handleMarkAll}>全部标为已读</button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {notifications.length === 0 ? (
        <div className="notifs-empty">暂无通知</div>
      ) : (
        <div className="notifs-list">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`notif-item${n.is_read ? '' : ' unread'}`}
              onClick={() => { if (!n.is_read) handleMarkRead(n.id) }}
            >
              <div className="notif-icon">{getIcon(n.type)}</div>
              <div className="notif-body">
                <p className="notif-content">{n.content || n.message}</p>
                {n.item_id && (
                  <Link
                    to={`/items/${n.item_id}`}
                    className="notif-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    查看物品
                  </Link>
                )}
                {n.claim_id && (
                  <Link
                    to="/my/claims"
                    className="notif-link"
                    onClick={(e) => e.stopPropagation()}
                  >
                    查看申请
                  </Link>
                )}
              </div>
              <div className="notif-meta">
                <span className="notif-time">
                  {n.created_at ? String(n.created_at).slice(0, 16).replace('T', ' ') : '-'}
                </span>
                {!n.is_read && <span className="unread-dot" />}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function getIcon(type) {
  const map = {
    claim_submitted: '📋',
    claim_approved: '✅',
    claim_rejected: '❌',
    match_found: '🔍',
    system: '📢',
  }
  return map[type] || '🔔'
}
