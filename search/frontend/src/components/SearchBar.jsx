import { useState } from 'react'
import './SearchBar.css'

export default function SearchBar({ initialValues = {}, onSearch }) {
  const [q, setQ] = useState(initialValues.q || '')
  const [type, setType] = useState(initialValues.type || 'lost')

  function handleSubmit(e) {
    e.preventDefault()
    onSearch({ q: q.trim(), type })
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="type-toggle">
        <button
          type="button"
          className={type === 'lost' ? 'active lost' : ''}
          onClick={() => setType('lost')}
        >
          失物寻找
        </button>
        <button
          type="button"
          className={type === 'found' ? 'active found' : ''}
          onClick={() => setType('found')}
        >
          招领信息
        </button>
      </div>

      <div className="search-input-row">
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={type === 'lost' ? '搜索丢失的物品…' : '搜索招领到的物品…'}
          className="search-input"
        />
        <button type="submit" className="search-btn">搜索</button>
      </div>
    </form>
  )
}
