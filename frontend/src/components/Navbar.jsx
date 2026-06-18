import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getUnreadCount } from '../api/claims'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    const stored = localStorage.getItem('user')
    if (stored) {
      try { setUser(JSON.parse(stored)) } catch { /* ignore */ }
    }
  }, [pathname])

  useEffect(() => {
    if (localStorage.getItem('token')) {
      getUnreadCount()
        .then((res) => setUnread(res.data?.unread_count || 0))
        .catch(() => {})
    } else {
      setUnread(0)
    }
  }, [pathname])

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }

  const isActive = (path) => pathname === path ? 'active' : ''

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">校园失物招领</Link>

        <div className="navbar-links">
          <Link to="/search?type=lost" className={pathname === '/search' ? 'active' : ''}>失物搜索</Link>
          <Link to="/search?type=found" className={pathname === '/search' ? 'active' : ''}>招领搜索</Link>

          {user ? (
            <>
              <Link to="/items/create" className={isActive('/items/create')}>发布信息</Link>
              <Link to="/my/claims" className={isActive('/my/claims')}>我的申请</Link>
              <Link to="/my/review" className={isActive('/my/review')}>审核管理</Link>
              <Link to="/notifications" className={isActive('/notifications')}>
                通知{unread > 0 && <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>}
              </Link>
              <Link to="/profile" className={`navbar-btn ${isActive('/profile')}`}>{user.username}</Link>
              <button className="navbar-logout" onClick={handleLogout}>退出</button>
            </>
          ) : (
            <>
              <Link to="/login">登录</Link>
              <Link to="/register" className="navbar-btn">注册</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
