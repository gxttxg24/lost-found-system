import React, { useEffect, useState } from 'react'
import { getItem, deleteItem } from '../api/items'

function getIdFromPath() {
  const parts = window.location.pathname.split('/')
  return parts[parts.length - 1]
}

export default function ItemDetail() {
  const [item, setItem] = useState(null)
  const [loading, setLoading] = useState(true)
  const id = getIdFromPath()

  useEffect(() => {
    async function load() {
      try {
        const res = await getItem(id)
        setItem(res.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleDelete = async () => {
    if (!confirm('确认删除该信息？')) return
    try {
      await deleteItem(id)
      alert('删除成功')
      window.location.href = '/'
    } catch (err) {
      alert(err?.response?.data?.message || '删除失败')
    }
  }

  if (loading) return <div>加载中...</div>
  if (!item) return <div>未找到</div>

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <h2>{item.title}</h2>
      <div>类型：{item.type}</div>
      <div>分类ID：{item.category_id}</div>
      <div>地点：{item.location}</div>
      <div>事件时间：{item.event_time}</div>
      <div>联系方式：{item.contact_info}</div>
      <div>状态：{item.status}</div>
      <div style={{ marginTop: 12 }}>{item.description}</div>
      <div style={{ marginTop: 12 }}>
        {item.images && item.images.map((src, i) => (
          <img key={i} src={src} alt={item.title} style={{ maxWidth: 200, marginRight: 8 }} />
        ))}
      </div>
      <div style={{ marginTop: 12 }}>
        <button onClick={handleDelete}>删除</button>
      </div>
    </div>
  )
}
