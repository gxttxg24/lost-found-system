import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Search from './pages/Search'
import ItemCreate from './pages/ItemCreate'
import ItemDetail from './pages/ItemDetail'
import MatchResult from './pages/MatchResult'
import MyClaims from './pages/MyClaims'
import ReviewClaims from './pages/ReviewClaims'
import Notifications from './pages/Notifications'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/search" element={<Search />} />
        <Route path="/items/create" element={<ItemCreate />} />
        <Route path="/items/:id" element={<ItemDetail />} />
        <Route path="/matches/:id" element={<MatchResult />} />
        <Route path="/my/claims" element={<MyClaims />} />
        <Route path="/my/review" element={<ReviewClaims />} />
        <Route path="/notifications" element={<Notifications />} />
      </Routes>
    </BrowserRouter>
  )
}
