
import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<div><h1>校园失物招领系统</h1><p>欢迎使用！请 <a href="/login">登录</a> 或 <a href="/register">注册</a></p></div>} />
      </Routes>
    </div>
  )
}

export default App

