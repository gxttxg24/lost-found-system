import { Link, useLocation } from 'react-router-dom'
import './Navbar.css'

export default function Navbar() {
  const { pathname } = useLocation()
  // auth 模块实现后，在此读取 localStorage token 并展示用户信息
  const token = localStorage.getItem('token')

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-brand">
          校园失物招领
        </Link>

        <div className="navbar-links">
          <Link to="/search?type=lost"  className={pathname === '/search' ? 'active' : ''}>
            失物搜索
          </Link>
          <Link to="/search?type=found" className={pathname === '/search' ? 'active' : ''}>
            招领搜索
          </Link>
          {/* auth 模块实现后替换以下内容 */}
          {token ? (
            <Link to="/profile">我的主页</Link>
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
