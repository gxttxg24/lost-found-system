import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import SearchBar from '../components/SearchBar'
import { searchItems, getCategories } from '../api/search'
import './Search.css'

const STATUS_LABELS = {
  open: '寻找中',
  matching: '匹配中',
  claimed: '已认领',
  closed: '已关闭',
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  // Derive state from URL params so pages/links are shareable
  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'lost'
  const categoryId = searchParams.get('category_id') || ''
  const status = searchParams.get('status') || ''
  const location = searchParams.get('location') || ''
  const startDate = searchParams.get('start_date') || ''
  const endDate = searchParams.get('end_date') || ''
  const sort = searchParams.get('sort') || 'relevance'
  const page = parseInt(searchParams.get('page') || '1', 10)

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  const PAGE_SIZE = 10

  // Load categories once
  useEffect(() => {
    getCategories()
      .then(res => setCategories(res.data.data || []))
      .catch(() => {})
  }, [])

  // Run search when URL params change
  const runSearch = useCallback(() => {
    setLoading(true)
    setError('')
    const params = {
      q, type, sort, page, page_size: PAGE_SIZE,
      ...(categoryId && { category_id: categoryId }),
      ...(status && { status }),
      ...(location && { location }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    }
    searchItems(params)
      .then(res => {
        const d = res.data.data
        setItems(d.items || [])
        setTotal(d.total || 0)
      })
      .catch(err => {
        setError(err.response?.data?.message || '搜索失败，请稍后重试')
        setItems([])
        setTotal(0)
      })
      .finally(() => setLoading(false))
  }, [q, type, categoryId, status, location, startDate, endDate, sort, page])

  useEffect(() => {
    runSearch()
  }, [runSearch])

  function updateParams(updates) {
    const next = new URLSearchParams(searchParams)
    Object.entries(updates).forEach(([k, v]) => {
      if (v) next.set(k, v)
      else next.delete(k)
    })
    // Reset to page 1 on filter change
    if (!('page' in updates)) next.set('page', '1')
    setSearchParams(next)
  }

  function handleSearch({ q: newQ, type: newType }) {
    updateParams({ q: newQ, type: newType, page: '1' })
  }

  function handlePageChange(newPage) {
    updateParams({ page: String(newPage) })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="search-page">
      <div className="search-hero">
        <SearchBar initialValues={{ q, type }} onSearch={handleSearch} />
      </div>

      <div className="search-body">
        {/* Filter panel */}
        <div className="filter-section">
          <button
            className="filter-toggle"
            onClick={() => setShowFilters(v => !v)}
          >
            {showFilters ? '收起筛选 ▲' : '展开筛选 ▼'}
          </button>

          {showFilters && (
            <div className="filter-grid">
              <label>
                <span>分类</span>
                <select
                  value={categoryId}
                  onChange={e => updateParams({ category_id: e.target.value })}
                >
                  <option value="">全部分类</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>状态</span>
                <select
                  value={status}
                  onChange={e => updateParams({ status: e.target.value })}
                >
                  <option value="">全部状态</option>
                  <option value="open">寻找中</option>
                  <option value="matching">匹配中</option>
                  <option value="claimed">已认领</option>
                </select>
              </label>

              <label>
                <span>地点</span>
                <input
                  type="text"
                  value={location}
                  onChange={e => updateParams({ location: e.target.value })}
                  placeholder="如：图书馆"
                />
              </label>

              <label>
                <span>开始日期</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => updateParams({ start_date: e.target.value })}
                />
              </label>

              <label>
                <span>结束日期</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => updateParams({ end_date: e.target.value })}
                />
              </label>

              <label>
                <span>排序</span>
                <select
                  value={sort}
                  onChange={e => updateParams({ sort: e.target.value })}
                >
                  <option value="relevance">相关度优先</option>
                  <option value="time_desc">最新发布</option>
                  <option value="time_asc">按时间最早</option>
                </select>
              </label>
            </div>
          )}
        </div>

        {/* Results header */}
        <div className="results-header">
          <span className="results-count">
            {loading ? '搜索中…' : `共 ${total} 条${type === 'lost' ? '失物' : '招领'}记录`}
          </span>
          {q && <span className="results-keyword">关键词："{q}"</span>}
        </div>

        {/* Error */}
        {error && <div className="search-error">{error}</div>}

        {/* Results list */}
        {!loading && !error && items.length === 0 && (
          <div className="search-empty">
            <p>没有找到相关{type === 'lost' ? '失物' : '招领'}信息</p>
            <p>试试减少筛选条件，或换个关键词</p>
          </div>
        )}

        <div className="item-list">
          {items.map(item => (
            <ItemCard key={item.id} item={item} type={type} />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
            >
              上一页
            </button>
            <span>{page} / {totalPages}</span>
            <button
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ItemCard({ item, type }) {
  const typeBadge = type === 'lost'
    ? <span className="badge badge-lost">失物</span>
    : <span className="badge badge-found">招领</span>

  const score = item.relevance_score != null
    ? <span className="relevance">相关度 {Math.round(item.relevance_score * 100)}%</span>
    : null

  return (
    <div className="item-card">
      {item.images?.[0] && (
        <img
          src={`http://localhost:5000/${item.images[0]}`}
          alt={item.title}
          className="item-thumb"
          onError={e => { e.target.style.display = 'none' }}
        />
      )}
      <div className="item-info">
        <div className="item-header">
          {typeBadge}
          <h3 className="item-title">{item.title}</h3>
          {score}
        </div>

        {item.description && (
          <p className="item-desc">{item.description.slice(0, 80)}{item.description.length > 80 ? '…' : ''}</p>
        )}

        <div className="item-meta">
          {item.category_name && <span>📁 {item.category_name}</span>}
          {item.location && <span>📍 {item.location}</span>}
          {item.event_time && (
            <span>📅 {item.event_time.slice(0, 10)}</span>
          )}
          <span>👤 {item.username || '匿名'}</span>
          <span className={`status-tag status-${item.status}`}>
            {STATUS_LABELS[item.status] || item.status}
          </span>
        </div>
      </div>

      <div className="item-actions">
        {/* items 模块实现后，此处换成 <Link to={`/items/${item.id}`}>查看详情</Link> */}
        <Link
          to={`/matches/${item.id}`}
          className="btn-match"
        >
          智能匹配
        </Link>
      </div>
    </div>
  )
}
