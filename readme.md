# 校园失物招领系统

数据库课程大作业。一个面向校园用户的失物招领平台，支持失物/招领信息发布、关键词搜索、智能相似度匹配、认领申请与审核、消息通知等完整业务流程。

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端 | React 18 + Vite 5 + React Router DOM v6 + Axios |
| 后端 | Python Flask 3 + Flask-JWT-Extended + Flask-CORS + PyMySQL |
| 数据库 | MySQL 8.0 |
| 智能匹配 | jieba 中文分词 + scikit-learn TF-IDF 余弦相似度 |
| 认证 | JWT Token（存储于 localStorage） |

## 目录结构

```
lost-found-system/
├── backend/                    # Flask 后端
│   ├── app.py                  # 应用入口，Blueprint 注册，CORS，错误处理
│   ├── config.py               # 数据库连接配置
│   ├── db.py                   # 数据库工具函数
│   ├── requirements.txt        # Python 依赖
│   ├── routes/
│   │   ├── auth.py             # 用户认证（注册/登录/个人信息）
│   │   ├── items.py            # 物品信息 CRUD + 图片上传
│   │   ├── search.py           # 关键词搜索 + 分类筛选
│   │   ├── matches.py          # 智能匹配（TF-IDF）
│   │   ├── claims.py           # 认领申请与审核
│   │   └── notifications.py    # 消息通知
│   ├── utils/
│   │   ├── response.py         # 统一响应格式 success() / fail()
│   │   └── match.py            # 智能匹配算法
│   ├── sql/
│   │   └── init.sql            # 数据库建表脚本（含初始分类数据）
│   └── uploads/                # 图片上传目录（运行后自动创建）
│
├── frontend/                   # React 前端
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx             # 路由配置
│       ├── index.css           # 全局样式（badge、按钮、alert 等公共类）
│       ├── api/
│       │   ├── request.js      # Axios 实例（自动附加 token，401/422 自动登出）
│       │   ├── auth.js
│       │   ├── items.js
│       │   ├── search.js
│       │   ├── matches.js
│       │   └── claims.js
│       ├── components/
│       │   ├── Navbar.jsx      # 顶部导航（含未读通知角标）
│       │   └── SearchBar.jsx   # 搜索框组件
│       └── pages/
│           ├── Home.jsx        # 首页（最新失物/招领 + 使用指南）
│           ├── Login.jsx
│           ├── Register.jsx
│           ├── Profile.jsx     # 个人中心（改资料/改密码）
│           ├── Search.jsx      # 搜索结果页（分类侧边栏 + 分页）
│           ├── ItemCreate.jsx  # 发布信息
│           ├── ItemDetail.jsx  # 物品详情（含认领弹窗）
│           ├── MatchResult.jsx # 智能匹配结果
│           ├── MyClaims.jsx    # 我的认领申请
│           ├── ReviewClaims.jsx# 审核他人申请
│           └── Notifications.jsx # 消息通知
│
├── auth/                       # 原用户认证模块分支代码（参考用）
├── claim/                      # 原认领模块分支代码（参考用）
├── search/                     # 原搜索模块分支代码（参考用）
├── info/                       # 原信息发布模块分支代码（参考用）
└── design.md                   # 系统设计文档
```

## 数据库设计

共 7 张表：

| 表名 | 说明 |
|------|------|
| `users` | 用户（id, username, password_hash, phone, email, role, status） |
| `categories` | 物品分类（证件/电子产品/书籍/生活用品/衣物饰品/其他） |
| `items` | 失物/招领信息（type: lost/found，status: open/matching/claimed/closed） |
| `item_images` | 物品图片（支持多图，存相对路径） |
| `matches` | 智能匹配结果（lost_item_id, found_item_id, similarity_score） |
| `claim_requests` | 认领申请（status: pending/approved/rejected/cancelled） |
| `notifications` | 消息通知（认领提交/审核结果/匹配提醒） |

## 快速开始

### 1. 初始化数据库

```bash
mysql -u root -p < backend/sql/init.sql
```

或在 MySQL Workbench / Navicat 中直接执行 `backend/sql/init.sql`。

> ⚠️ **Windows 用户注意**：cmd / PowerShell 的编码为 GBK，通过 `mysql < init.sql` 管道执行会导致中文乱码。
> **建议用以下方式之一导入**：
> ```bash
> # 方式一：登录 MySQL 后用 source 命令
> mysql -u root -p
> mysql> source backend/sql/init.sql;
>
> # 方式二：用 Python 脚本执行 SQL 文件
> cd backend
> python -c "from db import get_db_connection; conn = get_db_connection(); c = conn.cursor(); script = open('sql/init.sql', 'r', encoding='utf-8').read(); [c.execute(s) for s in script.split(';') if s.strip() and not s.strip().startswith('--')]; conn.commit(); c.close(); conn.close(); print('数据库初始化完成')"
> ```

### 2. 配置数据库连接

编辑 `backend/config.py`，修改为你的 MySQL 密码：

```python
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "你的密码",   # 修改这里
    "database": "lost_found_system",
    "charset": "utf8mb4"
}
```

### 3. 启动后端

```bash
cd backend
pip install -r requirements.txt
python app.py
```

后端运行于 http://localhost:5000

> 如果 pip 较慢，可使用清华源：
> `pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple`

### 4. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行于 http://localhost:5173

> 如果 npm 较慢：
> `npm install --registry https://registry.npmmirror.com`

## API 接口概览

所有接口返回统一格式：

```json
{ "code": 200, "message": "success", "data": { ... } }
```

需要登录的接口须在请求头携带：`Authorization: Bearer <token>`

### 用户认证 `/api/auth`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/register` | 注册 | 否 |
| POST | `/login` | 登录 | 否 |
| GET | `/me` | 获取当前用户信息 | 是 |
| PUT | `/profile` | 更新手机号/邮箱 | 是 |
| PUT | `/password` | 修改密码 | 是 |
| POST | `/logout` | 登出 | 是 |

### 物品信息 `/api/items`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/` | 获取物品列表（支持 type/status/category_id 筛选） | 否 |
| POST | `/` | 发布物品信息 | 是 |
| GET | `/mine` | 获取我发布的物品 | 是 |
| GET | `/<id>` | 获取物品详情 | 否 |
| PUT | `/<id>` | 更新物品信息 | 是 |
| DELETE | `/<id>` | 删除物品 | 是 |
| POST | `/<id>/images` | 上传物品图片 | 是 |

### 搜索 `/api/search`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/items` | 关键词搜索（支持全文检索/LIKE回退，TF-IDF重排） | 否 |
| GET | `/categories` | 获取所有分类 | 否 |

### 智能匹配 `/api/matches`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/item/<id>` | 获取物品的匹配结果（无结果时自动计算） | 否 |
| POST | `/trigger/<id>` | 手动触发重新匹配 | 是 |
| GET | `/my` | 我的物品匹配摘要 | 是 |

匹配算法综合评分：`0.6×文本相似度 + 0.2×分类匹配 + 0.1×地点相似度 + 0.1×时间接近度`

### 认领申请 `/api/claims`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| POST | `/` | 提交认领申请 | 是 |
| GET | `/mine` | 我提交的申请 | 是 |
| GET | `/item/<id>` | 某物品收到的所有申请（仅物主） | 是 |
| POST | `/<id>/review` | 审核申请（action: approve/reject） | 是 |
| POST | `/<id>/cancel` | 取消申请（仅申请人） | 是 |

### 消息通知 `/api/notifications`

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| GET | `/` | 获取通知列表 | 是 |
| GET | `/unread-count` | 获取未读数量 | 是 |
| PUT | `/<id>/read` | 标记单条已读 | 是 |
| PUT | `/read-all` | 全部标记已读 | 是 |
| DELETE | `/<id>` | 删除通知 | 是 |

## 模块分工

| 模块 | 负责内容 |
|------|---------|
| 用户认证（auth） | 注册、登录、JWT 认证、个人信息管理 |
| 信息发布（info） | 失物/招领发布、编辑、删除、图片上传 |
| 搜索与匹配（search） | 关键词搜索、分类筛选、TF-IDF 智能匹配 |
| 认领与通知（claim） | 认领申请、审核流程、消息通知 |
