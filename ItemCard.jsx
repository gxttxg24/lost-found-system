import React from 'react'

export default function ItemCard({ item }) {
  if (!item) return null
  return (
    <div style={{ border: '1px solid #ddd', padding: 12, borderRadius: 6 }}>
      <a href={`/items/${item.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <h4>{item.title}</h4>
      </a>
      <div>类型：{item.type} | 状态：{item.status}</div>
      <div>地点：{item.location}</div>
      {item.cover_image && <img src={item.cover_image} alt="cover" style={{ maxWidth: 120, marginTop: 8 }} />}
    </div>
  )
}
