import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import Search from './pages/Search'
import MatchResult from './pages/MatchResult'

// ── 其他模块在此添加 import ────────────────────────────────────
// import Login           from './pages/Login'
// import Register        from './pages/Register'
// import Home            from './pages/Home'
// import ItemCreate      from './pages/ItemCreate'
// import ItemDetail      from './pages/ItemDetail'
// import MyClaims        from './pages/MyClaims'
// import ReviewClaims    from './pages/ReviewClaims'
// import Notifications   from './pages/Notifications'
// import Profile         from './pages/Profile'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />

      <Routes>
        {/* 默认跳转到搜索页 */}
        <Route path="/" element={<Navigate to="/search?type=lost" replace />} />

        {/* 搜索与匹配模块 */}
        <Route path="/search"           element={<Search />} />
        <Route path="/matches/:itemId"  element={<MatchResult />} />

        {/* ── 其他模块在此添加 Route ───────────────────────── */}
        {/* <Route path="/login"            element={<Login />} />           */}
        {/* <Route path="/register"         element={<Register />} />        */}
        {/* <Route path="/home"             element={<Home />} />            */}
        {/* <Route path="/items/create"     element={<ItemCreate />} />      */}
        {/* <Route path="/items/:id"        element={<ItemDetail />} />      */}
        {/* <Route path="/my/claims"        element={<MyClaims />} />        */}
        {/* <Route path="/my/review"        element={<ReviewClaims />} />    */}
        {/* <Route path="/notifications"    element={<Notifications />} />   */}
        {/* <Route path="/profile"          element={<Profile />} />         */}
      </Routes>
    </BrowserRouter>
  )
}
