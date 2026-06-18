import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { searchItems, getCategories } from '../api/search'
import SearchBar from '../components/SearchBar'
import './Search.css'

const BASE_URL = 'http://localhost:5000'

const STATUS_LABELS = {
  open: '寻找中', matching: '匹配中', claimed: '已认领', closed: '已关闭',
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [results, setResults] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [categoryId, setCategoryId] = useState(searchParams.get('category_id') || '')

  const q = searchParams.get('q') || ''
  const type = searchParams.get('type') || 'lost'
  const page = Number(searchParams.get('page') || 1)
  const PAGE_SIZE = 12

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    doSearch()
  }, [q, type, page, categoryId])

  async function doSearch() {
    setLoading(true)
    setError('')
    try {
      const res = await searchItems({
        q: q || undefined,
        type,
        category_id: categoryId || undefined,
        page,
        page_size: PAGE_SIZE,
      })
      if (res.code === 200) {
        setResults(res.data.items || [])
        setTotal(res.data.total || 0)
      } else {
        setError(res.message)
      }
    } catch (err) {
      setError('搜索失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  function handleSearch({ q: newQ, type: newType }) {
    setSearchParams({
      ...(newQ ? { q: newQ } : {}),
      type: newType,
      ...(categoryId ? { category_id: categoryId } : {}),
      page: '1',
    })
  }

  function handleCategory(id) {
    setCategoryId(id)
    setSearchParams({
      ...(q ? { q } : {}),
      type,
      ...(id ? { category_id: id } : {}),
      page: '1',
    })
  }

  function handlePage(p) {
    setSearchParams({
      ...(q ? { q } : {}),
      type,
      ...(categoryId ? { category_id: categoryId } : {}),
      page: String(p),
    })
    window.scrollTo({ top: 0 })
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="search-page">
      <div className="search-header">
        <SearchBar
          initialValues={{ q, type }}
          onSearch={handleSearch}
        />
      </div>

      <div className="search-body">
        {/* Sidebar */}
        <aside className="search-sidebar">
          <h4>分类筛选</h4>
          <ul className="cat-list">
            <li>
              <button
                className={!categoryId ? 'cat-item active' : 'cat-item'}
                onClick={() => handleCategory('')}
              >
                全部分类
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.id}>
                <button
                  className={categoryId === String(c.id) ? 'cat-item active' : 'cat-item'}
                  onClick={() => handleCategory(String(c.id))}
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        {/* Results */}
        <main className="search-results">
          <div className="results-info">
            {q ? (
              <span>"{q}" 的搜索结果 — 共 {total} 条</span>
            ) : (
              <span>全部{type === 'lost' ? '失物' : '招领'}信息 — 共 {total} 条</span>
            )}
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {loading ? (
            <div className="search-loading">搜索中...</div>
          ) : results.length === 0 ? (
            <div className="search-empty">
              <p>暂无匹配的信息</p>
              <Link to="/items/create" className="primary-button">发布信息</Link>
            </div>
          ) : (
            <>
              <div className="results-grid">
                {results.map((item) => (
                  <SearchResultCard key={item.id} item={item} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="pagination">
                  <button
                    disabled={page <= 1}
                    onClick={() => handlePage(page - 1)}
                    className="ghost-button"
                  >
                    上一页
                  </button>
                  <span>{page} / {totalPages}</span>
                  <button
                    disabled={page >= totalPages}
                    onClick={() => handlePage(page + 1)}
                    className="ghost-button"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  )
}

function SearchResultCard({ item }) {
  const typeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found'
  const typeLabel = item.type === 'lost' ? '失物' : '招领'

  return (
    <Link to={`/items/${item.id}`} className="result-card">
      {item.images?.[0] && (
        <img
          src={`${BASE_URL}/${item.images[0]}`}
          alt={item.title}
          className="result-thumb"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="result-body">
        <div className="result-top">
          <span className={`badge ${typeClass}`}>{typeLabel}</span>
          {item.category_name && <span className="cat-tag">{item.category_name}</span>}
          <span className={`status-tag status-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</span>
        </div>
        <h3 className="result-title">{item.title}</h3>
        {item.description && (
          <p className="result-desc">{item.description.slice(0, 80)}{item.description.length > 80 ? '...' : ''}</p>
        )}
        <div className="result-footer">
          {item.location && <span>📍 {item.location}</span>}
          {item.event_time && <span>📅 {item.event_time.slice(0, 10)}</span>}
        </div>
      </div>
    </Link>
  )
}
