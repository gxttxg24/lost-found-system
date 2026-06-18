import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api/auth'
import './Auth.css'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '', password: '', confirmPassword: '', phone: '', email: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleChange = (e) =>
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.username.length < 3 || formData.username.length > 50)
      return setError('用户名长度应在3-50个字符之间')
    if (formData.password.length < 6)
      return setError('密码长度至少为6个字符')
    if (formData.password !== formData.confirmPassword)
      return setError('两次输入的密码不一致')

    setLoading(true)
    try {
      const res = await register({
        username: formData.username,
        password: formData.password,
        phone: formData.phone,
        email: formData.email,
      })
      if (res.code === 200) {
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('user', JSON.stringify(res.data.user))
        navigate('/')
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>注册</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名 *</label>
            <input name="username" value={formData.username} onChange={handleChange} required placeholder="3-50个字符" />
          </div>
          <div className="form-group">
            <label>密码 *</label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} required placeholder="至少6个字符" />
          </div>
          <div className="form-group">
            <label>确认密码 *</label>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required placeholder="再次输入密码" />
          </div>
          <div className="form-group">
            <label>手机号</label>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="选填" />
          </div>
          <div className="form-group">
            <label>邮箱</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="选填" />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="auth-button">
            {loading ? '注册中...' : '注册'}
          </button>
        </form>
        <p className="auth-link">已有账号？<Link to="/login">立即登录</Link></p>
      </div>
    </div>
  )
}
