import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getItems } from '../api/items'
import './Home.css'

const BASE_URL = 'http://localhost:5000'

const STATUS_LABELS = {
  open: '寻找中', matching: '匹配中', claimed: '已认领', closed: '已关闭',
}

export default function Home() {
  const [lostItems, setLostItems] = useState([])
  const [foundItems, setFoundItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getItems({ type: 'lost', page_size: 4, status: 'open' }),
      getItems({ type: 'found', page_size: 4, status: 'open' }),
    ])
      .then(([lostRes, foundRes]) => {
        setLostItems(lostRes.data?.items || [])
        setFoundItems(foundRes.data?.items || [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const isLoggedIn = !!localStorage.getItem('token')

  return (
    <div className="home-page">
      {/* Hero */}
      <div className="home-hero">
        <h1>校园失物招领平台</h1>
        <p>快速找回失物，帮助他人找回物品</p>
        <div className="hero-actions">
          <button className="hero-btn-lost" onClick={() => navigate('/search?type=lost')}>
            查找失物
          </button>
          <button className="hero-btn-found" onClick={() => navigate('/search?type=found')}>
            查看招领
          </button>
          {isLoggedIn && (
            <button className="hero-btn-post" onClick={() => navigate('/items/create')}>
              发布信息
            </button>
          )}
        </div>
      </div>

      <div className="home-content">
        {/* Recent lost */}
        <section className="home-section">
          <div className="section-head">
            <h2>最新失物</h2>
            <Link to="/search?type=lost">查看全部 →</Link>
          </div>
          {loading ? (
            <div className="home-loading">加载中...</div>
          ) : lostItems.length === 0 ? (
            <div className="home-empty">暂无失物信息</div>
          ) : (
            <div className="item-grid">
              {lostItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Recent found */}
        <section className="home-section">
          <div className="section-head">
            <h2>最新招领</h2>
            <Link to="/search?type=found">查看全部 →</Link>
          </div>
          {loading ? (
            <div className="home-loading">加载中...</div>
          ) : foundItems.length === 0 ? (
            <div className="home-empty">暂无招领信息</div>
          ) : (
            <div className="item-grid">
              {foundItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* Quick guide */}
        <section className="home-section guide-section">
          <h2>使用流程</h2>
          <div className="guide-grid">
            <div className="guide-step">
              <div className="step-icon">📝</div>
              <h3>发布信息</h3>
              <p>登录后发布失物或招领信息，填写详细描述和联系方式</p>
            </div>
            <div className="guide-step">
              <div className="step-icon">🔍</div>
              <h3>搜索匹配</h3>
              <p>系统智能匹配相似物品，也可关键词搜索或按分类筛选</p>
            </div>
            <div className="guide-step">
              <div className="step-icon">📋</div>
              <h3>发起认领</h3>
              <p>找到对应物品后提交认领申请，等待物主审核确认</p>
            </div>
            <div className="guide-step">
              <div className="step-icon">✅</div>
              <h3>完成认领</h3>
              <p>物主审核通过后，双方联系确认，顺利取回物品</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function ItemCard({ item }) {
  const typeClass = item.type === 'lost' ? 'badge-lost' : 'badge-found'
  const typeLabel = item.type === 'lost' ? '失物' : '招领'

  return (
    <Link to={`/items/${item.id}`} className="home-item-card">
      {item.images?.[0] && (
        <img
          src={`${BASE_URL}/${item.images[0]}`}
          alt={item.title}
          className="card-thumb"
          onError={(e) => { e.target.style.display = 'none' }}
        />
      )}
      <div className="card-body">
        <div className="card-header">
          <span className={`badge ${typeClass}`}>{typeLabel}</span>
          <span className={`status-tag status-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</span>
        </div>
        <h3 className="card-title">{item.title}</h3>
        {item.location && <p className="card-location">📍 {item.location}</p>}
        {item.event_time && <p className="card-time">📅 {item.event_time.slice(0, 10)}</p>}
      </div>
    </Link>
  )
}
