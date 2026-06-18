import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createItem, uploadItemImage } from '../api/items'
import { getCategories } from '../api/search'
import './ItemCreate.css'

export default function ItemCreate() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState([])
  const [form, setForm] = useState({
    type: 'lost',
    category_id: '',
    title: '',
    description: '',
    location: '',
    event_time: '',
    contact_info: '',
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login')
      return
    }
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) return setError('请填写标题')
    setLoading(true)
    setError('')
    try {
      const res = await createItem({
        ...form,
        category_id: form.category_id ? Number(form.category_id) : undefined,
      })
      if (res.code !== 200) return setError(res.message)
      const id = res.data.item_id
      for (const f of files) {
        await uploadItemImage(id, f)
      }
      navigate(`/items/${id}`)
    } catch (err) {
      setError(err.response?.data?.message || '发布失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-page">
      <div className="create-card">
        <h2>发布失物 / 招领信息</h2>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} className="create-form">
          <div className="form-row">
            <label className="form-label">
              <span>类型 *</span>
              <div className="type-radio">
                <label>
                  <input type="radio" name="type" value="lost" checked={form.type === 'lost'} onChange={handleChange} />
                  失物（我丢了东西）
                </label>
                <label>
                  <input type="radio" name="type" value="found" checked={form.type === 'found'} onChange={handleChange} />
                  招领（我捡到了东西）
                </label>
              </div>
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              <span>分类</span>
              <select name="category_id" value={form.category_id} onChange={handleChange}>
                <option value="">请选择分类</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              <span>标题 *</span>
              <input name="title" value={form.title} onChange={handleChange} required placeholder="简短描述物品（如：黑色AirPods耳机）" />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              <span>详细描述</span>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                placeholder="描述物品特征、丢失/发现情况等"
              />
            </label>
          </div>

          <div className="form-row two-col">
            <label className="form-label">
              <span>地点</span>
              <input name="location" value={form.location} onChange={handleChange} placeholder="如：图书馆三楼" />
            </label>
            <label className="form-label">
              <span>时间</span>
              <input type="datetime-local" name="event_time" value={form.event_time} onChange={handleChange} />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              <span>联系方式</span>
              <input name="contact_info" value={form.contact_info} onChange={handleChange} placeholder="手机号/微信/QQ 等" />
            </label>
          </div>

          <div className="form-row">
            <label className="form-label">
              <span>图片（可多选）</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => setFiles(Array.from(e.target.files))}
              />
              {files.length > 0 && (
                <span className="file-hint">已选择 {files.length} 张图片</span>
              )}
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="primary-button" disabled={loading}>
              {loading ? '发布中...' : '发布'}
            </button>
            <button type="button" className="ghost-button" onClick={() => navigate(-1)}>
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
