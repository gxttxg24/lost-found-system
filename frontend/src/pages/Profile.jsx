import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCurrentUser, updateProfile, changePassword, logout } from '../api/auth'
import './Profile.css'

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [profileForm, setProfileForm] = useState({ phone: '', email: '' })
  const [pwForm, setPwForm] = useState({ old_password: '', new_password: '', confirm: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    getCurrentUser()
      .then((res) => {
        if (res.code === 200) {
          setUser(res.data)
          setProfileForm({ phone: res.data.phone || '', email: res.data.email || '' })
        }
      })
      .catch(() => navigate('/login'))
      .finally(() => setLoading(false))
  }, [])

  async function handleProfileSave(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const res = await updateProfile(profileForm)
      if (res.code === 200) {
        setUser(res.data)
        localStorage.setItem('user', JSON.stringify(res.data))
        setMessage('个人信息已更新')
        setEditMode(false)
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '更新失败')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (pwForm.new_password !== pwForm.confirm)
      return setError('两次输入的新密码不一致')
    if (pwForm.new_password.length < 6)
      return setError('新密码至少6个字符')
    setSaving(true)
    try {
      const res = await changePassword({
        old_password: pwForm.old_password,
        new_password: pwForm.new_password,
      })
      if (res.code === 200) {
        setMessage('密码修改成功')
        setPwForm({ old_password: '', new_password: '', confirm: '' })
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError(err.response?.data?.message || '密码修改失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogout() {
    await logout().catch(() => {})
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  if (loading) return <div className="profile-loading">加载中...</div>
  if (!user) return null

  return (
    <div className="profile-page">
      <div className="profile-card">
        <div className="profile-header">
          <div className="avatar-circle">{user.username?.[0]?.toUpperCase()}</div>
          <div>
            <h2>{user.username}</h2>
            <span className={`role-badge role-${user.role}`}>{user.role === 'admin' ? '管理员' : '普通用户'}</span>
          </div>
        </div>

        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Info section */}
        <div className="profile-section">
          <div className="section-title-row">
            <h3>个人信息</h3>
            {!editMode && (
              <button className="ghost-button" onClick={() => setEditMode(true)}>编辑</button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleProfileSave} className="profile-form">
              <label>
                <span>手机号</span>
                <input
                  type="tel"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="选填"
                />
              </label>
              <label>
                <span>邮箱</span>
                <input
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => setProfileForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="选填"
                />
              </label>
              <div className="form-actions">
                <button type="submit" className="primary-button" disabled={saving}>
                  {saving ? '保存中...' : '保存'}
                </button>
                <button type="button" className="ghost-button" onClick={() => setEditMode(false)}>
                  取消
                </button>
              </div>
            </form>
          ) : (
            <div className="info-grid">
              <div><span>手机号</span><p>{user.phone || '未设置'}</p></div>
              <div><span>邮箱</span><p>{user.email || '未设置'}</p></div>
              <div><span>注册时间</span><p>{user.created_at ? String(user.created_at).slice(0, 10) : '-'}</p></div>
              <div><span>账号状态</span><p>{user.status === 'normal' ? '正常' : '已封禁'}</p></div>
            </div>
          )}
        </div>

        {/* Password section */}
        <div className="profile-section">
          <h3>修改密码</h3>
          <form onSubmit={handlePasswordChange} className="profile-form">
            <label>
              <span>旧密码</span>
              <input
                type="password"
                value={pwForm.old_password}
                onChange={(e) => setPwForm((p) => ({ ...p, old_password: e.target.value }))}
                required
              />
            </label>
            <label>
              <span>新密码</span>
              <input
                type="password"
                value={pwForm.new_password}
                onChange={(e) => setPwForm((p) => ({ ...p, new_password: e.target.value }))}
                required
                placeholder="至少6个字符"
              />
            </label>
            <label>
              <span>确认新密码</span>
              <input
                type="password"
                value={pwForm.confirm}
                onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                required
              />
            </label>
            <div className="form-actions">
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? '修改中...' : '修改密码'}
              </button>
            </div>
          </form>
        </div>

        {/* Logout */}
        <div className="profile-section">
          <button className="danger-button" onClick={handleLogout}>退出登录</button>
        </div>
      </div>
    </div>
  )
}
