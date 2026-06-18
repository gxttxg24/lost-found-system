import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api/auth'
import './Auth.css'

export default function Login() {
  const [formData, setFormData] = useState({ username: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(formData)
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        navigate('/')
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>登录</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input name="username" value={formData.username} onChange={handleChange} required placeholder="请输入用户名" />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="请输入密码" />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <p className="auth-link">还没有账号？<Link to="/register">立即注册</Link></p>
      </div>
    </div>
  )
}
