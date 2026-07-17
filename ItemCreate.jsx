import React, { useState } from 'react'
import { createItem, uploadItemImage } from '../api/items'

export default function ItemCreate() {
  const [form, setForm] = useState({
    type: 'lost',
    category_id: '',
    title: '',
    description: '',
    location: '',
    event_time: '',
    contact_info: ''
  })
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((s) => ({ ...s, [name]: value }))
  }

  const handleFiles = (e) => {
    setFiles(Array.from(e.target.files))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await createItem(form)
      const id = res.data.data.item_id
      for (const f of files) {
        await uploadItemImage(id, f)
      }
      alert('发布成功')
      window.location.href = `/items/${id}`
    } catch (err) {
      console.error(err)
      alert(err?.response?.data?.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2>发布失物/招领</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>类型</label>
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="lost">失物</option>
            <option value="found">招领</option>
          </select>
        </div>
        <div>
          <label>分类ID</label>
          <input name="category_id" value={form.category_id} onChange={handleChange} />
        </div>
        <div>
          <label>标题</label>
          <input name="title" value={form.title} onChange={handleChange} required />
        </div>
        <div>
          <label>描述</label>
          <textarea name="description" value={form.description} onChange={handleChange} />
        </div>
        <div>
          <label>地点</label>
          <input name="location" value={form.location} onChange={handleChange} />
        </div>
        <div>
          <label>时间</label>
          <input name="event_time" value={form.event_time} onChange={handleChange} placeholder="YYYY-MM-DD HH:mm:ss" />
        </div>
        <div>
          <label>联系方式</label>
          <input name="contact_info" value={form.contact_info} onChange={handleChange} />
        </div>
        <div>
          <label>图片</label>
          <input type="file" multiple accept="image/*" onChange={handleFiles} />
        </div>
        <div>
          <button type="submit" disabled={loading}>{loading ? '发布中...' : '发布'}</button>
        </div>
      </form>
    </div>
  )
}
