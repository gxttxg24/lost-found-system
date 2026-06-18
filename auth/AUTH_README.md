
# 用户认证模块说明文档

## 模块概述

本模块负责校园失物招领系统的用户认证功能，包括用户注册、登录、个人信息管理等。

## 技术栈

- **后端**: Flask + Flask-JWT-Extended + Werkzeug
- **前端**: React + Axios + React Router
- **数据库**: MySQL 8.0

## 项目结构

```
lost-found-system/
├── backend/
│   ├── app.py                 # 后端入口文件
│   ├── config.py              # 数据库配置
│   ├── db.py                  # 数据库操作工具
│   ├── requirements.txt       # Python依赖
│   ├── routes/
│   │   └── auth.py            # 认证路由（核心文件）
│   ├── utils/
│   │   └── response.py        # 统一响应格式
│   └── sql/
│       └── init.sql           # 数据库初始化脚本
└── frontend/
    ├── src/
    │   ├── api/
    │   │   ├── request.js     # Axios请求配置
    │   │   └── auth.js        # 认证API封装
    │   └── pages/
    │       ├── Login.jsx      # 登录页面
    │       ├── Register.jsx   # 注册页面
    │       └── Auth.css       # 认证页面样式
    └── package.json
```

## 后端API接口

### 1. 用户注册

**接口**: `POST /api/auth/register`

**请求体**:
```json
{
  "username": "zhangsan",
  "password": "123456",
  "phone": "13800138000",
  "email": "zhangsan@example.com"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "zhangsan",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "avatar_url": null,
      "role": "user",
      "status": "normal",
      "created_at": "2024-01-01T00:00:00"
    }
  }
}
```

### 2. 用户登录

**接口**: `POST /api/auth/login`

**请求体**:
```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "zhangsan",
      "phone": "13800138000",
      "email": "zhangsan@example.com",
      "avatar_url": null,
      "role": "user",
      "status": "normal",
      "created_at": "2024-01-01T00:00:00"
    }
  }
}
```

### 3. 获取当前用户信息

**接口**: `GET /api/auth/me`

**请求头**: `Authorization: Bearer &lt;token&gt;`

**响应示例**:
```json
{
  "code": 200,
  "message": "获取成功",
  "data": {
    "id": 1,
    "username": "zhangsan",
    "phone": "13800138000",
    "email": "zhangsan@example.com",
    "avatar_url": null,
    "role": "user",
    "status": "normal",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

### 4. 更新个人信息

**接口**: `PUT /api/auth/profile`

**请求头**: `Authorization: Bearer &lt;token&gt;`

**请求体**:
```json
{
  "phone": "13900139000",
  "email": "newemail@example.com",
  "avatar_url": "http://example.com/avatar.jpg"
}
```

### 5. 修改密码

**接口**: `PUT /api/auth/password`

**请求头**: `Authorization: Bearer &lt;token&gt;`

**请求体**:
```json
{
  "old_password": "123456",
  "new_password": "654321"
}
```

### 6. 登出

**接口**: `POST /api/auth/logout`

**请求头**: `Authorization: Bearer &lt;token&gt;`

## 前端API使用

### 导入API函数

```javascript
import { register, login, getCurrentUser, updateProfile, changePassword, logout } from '../api/auth'
```

### 注册示例

```javascript
try {
  const res = await register({
    username: 'zhangsan',
    password: '123456',
    phone: '13800138000',
    email: 'zhangsan@example.com'
  })
  if (res.code === 200) {
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }
} catch (err) {
  console.error(err)
}
```

### 登录示例

```javascript
try {
  const res = await login({
    username: 'zhangsan',
    password: '123456'
  })
  if (res.code === 200) {
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
  }
} catch (err) {
  console.error(err)
}
```

## 数据库表结构

### users表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 用户ID，主键 |
| username | VARCHAR(50) | 用户名，唯一 |
| password_hash | VARCHAR(255) | 密码哈希 |
| phone | VARCHAR(20) | 手机号 |
| email | VARCHAR(100) | 邮箱 |
| avatar_url | VARCHAR(255) | 头像URL |
| role | ENUM | 角色：user/admin |
| status | ENUM | 状态：normal/banned |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

## 后端启动步骤

1. 进入后端目录: `cd backend`
2. 创建虚拟环境: `python -m venv venv`
3. 激活虚拟环境: `venv\Scripts\activate` (Windows) 或 `source venv/bin/activate` (Mac/Linux)
4. 安装依赖: `pip install -r requirements.txt`
5. 配置数据库密码: 修改 `config.py` 中的 `password`
6. 初始化数据库: 使用 MySQL Workbench 或命令行执行 `sql/init.sql`
7. 启动后端: `python app.py`

后端服务将运行在 `http://localhost:5000`

## 前端启动步骤

1. 进入前端目录: `cd frontend`
2. 安装依赖: `npm install`
3. 启动前端: `npm run dev`

前端服务将运行在 `http://localhost:5173`

## 安全特性

- 密码使用 Werkzeug 的 `generate_password_hash` 进行哈希存储
- JWT Token 认证，有效期为1天
- Token 自动添加到请求头
- 401未授权自动跳转登录页
- 用户名唯一性校验
- 密码长度校验（至少6位）
- 用户状态检查（禁止封禁用户登录）

## 开发说明

### 后端路由文件 (routes/auth.py)

主要功能：
- `register()`: 用户注册
- `login()`: 用户登录
- `get_current_user()`: 获取当前用户（JWT保护）
- `update_profile()`: 更新个人信息（JWT保护）
- `change_password()`: 修改密码（JWT保护）
- `logout()`: 登出

### 前端页面

- `Login.jsx`: 登录页面
- `Register.jsx`: 注册页面
- `Auth.css`: 统一样式

### 统一响应格式

所有API响应遵循以下格式：

```json
{
  "code": 200,
  "message": "操作说明",
  "data": {}
}
```

成功时 `code` 为 200，失败时为其他状态码。

## 注意事项

1. 修改 `backend/config.py` 中的数据库密码为你自己的密码
2. 确保 MySQL 服务已启动
3. 确保先执行 `sql/init.sql` 初始化数据库
4. JWT_SECRET_KEY 在生产环境中应该使用环境变量
5. Token 存储在 localStorage 中，生产环境可考虑更安全的存储方式

