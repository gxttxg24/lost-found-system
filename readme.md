
# 校园失物招领系统 Lost Found System

本项目是数据库课程大作业，目标是实现一个基于数据库的校园失物招领管理系统。系统支持用户注册登录、失物/招领信息发布、搜索筛选、智能匹配推荐、认领申请与审核等功能。

## 模块分工

- **用户认证模块**: 负责用户注册、登录、JWT认证、个人信息管理（见 `AUTH_README.md`）
- **信息发布管理模块**: 发布失物/招领信息、编辑信息、删除信息、查看详情
- **搜索与智能匹配模块**: 关键词搜索、分类筛选、智能匹配、相似度计算
- **认领与审核模块**: 发起认领申请、查看申请、审核申请、通知消息

## 一、项目技术栈

### 前端
- React + Vite
- Axios
- React Router DOM

### 后端
- Python Flask
- Flask-CORS
- PyMySQL
- Flask-JWT-Extended
- Werkzeug
- jieba
- scikit-learn

### 数据库
- MySQL 8.0

### 登录认证
- JWT Token

## 二、项目目录结构

```
lost-found-system/
├── frontend/              # 前端项目 React + Vite
│   ├── src/
│   │   ├── api/          # 前端接口请求文件
│   │   │   ├── request.js
│   │   │   └── auth.js
│   │   ├── pages/        # 页面文件
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── backend/              # 后端项目 Flask
│   ├── app.py            # 后端入口文件
│   ├── config.py         # 数据库配置文件
│   ├── db.py             # 数据库连接工具
│   ├── requirements.txt  # 后端依赖列表
│   ├── routes/           # 后端接口模块
│   │   └── auth.py       # 认证路由
│   ├── utils/            # 工具函数
│   │   └── response.py
│   ├── uploads/          # 图片上传目录
│   └── sql/
│       └── init.sql      # 数据库建表脚本
├── AUTH_README.md        # 用户认证模块详细文档
└── readme.md
```

## 三、环境配置

### MySQL 安装

1. 下载并安装 MySQL 8.0
2. 设置 root 密码
3. 确保 MySQL 服务已启动

### 初始化数据库

使用 MySQL Workbench 或命令行执行 `backend/sql/init.sql`

### 后端配置

修改 `backend/config.py` 中的数据库密码为你自己的密码。

## 四、启动项目

### 启动后端

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux
pip install -r requirements.txt
python app.py
```

后端运行在: http://localhost:5000

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在: http://localhost:5173

## 五、用户认证模块

详细文档请查看 [AUTH_README.md](./AUTH_README.md)

### 主要功能

- 用户注册
- 用户登录
- 获取当前用户信息
- 更新个人信息
- 修改密码
- 用户登出

### 主要API

- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户
- `PUT /api/auth/profile` - 更新个人信息
- `PUT /api/auth/password` - 修改密码

## 六、开发说明

- 所有后端API返回统一格式：`{code, message, data}`
- 需要认证的API需要在请求头添加：`Authorization: Bearer &lt;token&gt;`
- Token 存储在前端 localStorage 中
- 数据库字符集使用 utf8mb4

