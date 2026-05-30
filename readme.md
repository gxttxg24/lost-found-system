# 校园失物招领系统 Lost Found System

本项目是数据库课程大作业，目标是实现一个基于数据库的校园失物招领管理系统。系统支持用户注册登录、失物/招领信息发布、搜索筛选、智能匹配推荐、认领申请与审核等功能。

## 一、项目技术栈

### 前端

```text
React + Vite
Axios
React Router DOM
```

### 后端

```text
Python Flask
Flask-CORS
PyMySQL
Flask-JWT-Extended
Werkzeug
jieba
scikit-learn
```

### 数据库

```text
MySQL 8.0
```

### 登录认证

```text
JWT Token
```

### 图片上传

```text
后端本地 uploads 文件夹
数据库中保存图片路径
```

---

## 二、项目目录结构

当前项目结构如下：

```text
lost-found-system/
├── frontend/                  # 前端项目 React + Vite
│   ├── node_modules/           # 前端依赖，不提交到 GitHub
│   ├── public/
│   ├── src/
│   │   ├── api/                # 前端接口请求文件
│   │   │   ├── request.js
│   │   │   ├── auth.js
│   │   │   ├── items.js
│   │   │   ├── search.js
│   │   │   ├── matches.js
│   │   │   └── claims.js
│   │   ├── components/         # 公共组件
│   │   │   ├── Navbar.jsx
│   │   │   ├── ItemCard.jsx
│   │   │   └── SearchBar.jsx
│   │   ├── pages/              # 页面文件
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── ItemCreate.jsx
│   │   │   ├── ItemDetail.jsx
│   │   │   ├── Search.jsx
│   │   │   ├── MatchResult.jsx
│   │   │   ├── MyClaims.jsx
│   │   │   └── ReviewClaims.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/                   # 后端项目 Flask
│   ├── venv/                  # Python 虚拟环境，不提交到 GitHub
│   ├── app.py                 # 后端入口文件
│   ├── config.py              # 数据库配置文件
│   ├── db.py                  # 数据库连接工具
│   ├── requirements.txt       # 后端依赖列表
│   ├── routes/                # 后端接口模块
│   │   ├── auth.py
│   │   ├── items.py
│   │   ├── search.py
│   │   ├── matches.py
│   │   ├── claims.py
│   │   └── notifications.py
│   ├── utils/                 # 工具函数
│   │   ├── response.py
│   │   └── match.py
│   ├── uploads/               # 图片上传目录，不提交到 GitHub
│   │   ├── items/
│   │   └── avatars/
│   └── sql/
│       └── init.sql           # 数据库建表脚本
│
├── docs/                      # 项目文档
│   └── 接口设计文档.md
│
├── .gitignore
└── README.md
```

---

## 三、第一次拉取项目

第一次使用项目时，先从 GitHub 克隆仓库：

```bash
git clone 仓库地址
cd lost-found-system
```

项目使用 `dev` 分支开发，则切换到 `dev`：

```bash
git checkout dev
```

如果本地没有 `dev` 分支，可以执行：

```bash
git checkout -b dev origin/dev
```

---

## 四、前端环境配置

### 1. 进入前端目录

```bash
cd frontend
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动前端

```bash
npm run dev
```

启动成功后，浏览器访问：

```text
http://localhost:5173
```

如果能看到 Vite 或项目首页，说明前端启动成功。

---

## 五、后端环境配置

### 1. 进入后端目录

```bash
cd backend
```

### 2. 创建 Python 虚拟环境

Windows：

```bash
python -m venv venv
```

macOS / Linux：

```bash
python3 -m venv venv
```

### 3. 激活虚拟环境

Windows PowerShell：

```bash
venv\Scripts\activate
```

macOS / Linux：

```bash
source venv/bin/activate
```

激活成功后，终端前面一般会出现：

```text
(venv)
```

### 4. 安装后端依赖

```bash
pip install -r requirements.txt
```

如果 `requirements.txt` 还没有生成，可以手动安装：

```bash
pip install flask flask-cors pymysql flask-jwt-extended werkzeug scikit-learn jieba
```

然后生成依赖文件：

```bash
pip freeze > requirements.txt
```

### 5. 启动后端

```bash
python app.py
```

启动成功后，浏览器访问：

```text
http://localhost:5000
```

如果返回类似下面的 JSON，说明后端启动成功：

```json
{
  "code": 200,
  "message": "Lost and Found backend is running",
  "data": null
}
```

---

## 六、MySQL 安装说明

本项目使用 MySQL 作为数据库。如果电脑上还没有安装 MySQL，需要先安装。

### 1. 下载 MySQL

推荐安装：

```text
MySQL Installer for Windows
```

下载地址建议使用 MySQL 官方网站：

```text
https://dev.mysql.com/downloads/installer/
```

Windows 用户建议下载完整安装包：

```text
mysql-installer-community
```

不要下载第三方网站的安装包。

### 2. 安装类型选择

安装时建议选择：

```text
Developer Default
```

这样会自动安装：

```text
MySQL Server
MySQL Workbench
MySQL Shell
相关连接工具
```

其中最重要的是：

```text
MySQL Server：真正的数据库服务
MySQL Workbench：图形化数据库管理工具
```

### 3. 设置 root 密码

安装过程中会要求设置 root 用户密码。

请务必记住该密码，后续后端连接数据库时需要使用。

例如，如果设置的密码是：

```text
123456
```

那么后端配置文件config.py中也要写这个密码。

### 4. 默认端口

MySQL 默认端口为：

```text
3306
```

一般保持默认即可。

---

## 七、初始化数据库

### 方法一：使用 MySQL Workbench 执行

打开 MySQL Workbench，连接本地数据库：

```text
Local instance MySQL80
```

输入安装时设置的 root 密码。

然后选择：

```text
File -> Open SQL Script
```

打开项目中的 SQL 文件：

```text
backend/sql/init.sql
```

点击闪电按钮执行。

执行成功后，左侧数据库中应该能看到：

```text
lost_found_system
```

展开后可以看到以下数据表：

```text
users
categories
items
item_images
matches
claim_requests
notifications
```

### 方法二：使用命令行执行

将
```
C:\Program Files\MySQL\MySQL Server 8.0\bin
```
加入环境变量

在 `backend` 目录下执行：

```bash
mysql -u root -p < sql/init.sql
```

然后输入 MySQL 的 root 密码。

注意：SQL 语句不能直接写在 PowerShell 里执行，必须在 MySQL 环境中执行，或者通过 Workbench 执行。

---

## 八、后端数据库配置

后端数据库配置文件为：

```text
backend/config.py
```

示例配置如下：

```python
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "你的MySQL密码",
    "database": "lost_found_system",
    "charset": "utf8mb4"
}
```

每个人本地的 MySQL 密码可能不同，因此 `config.py` 中的 `password` 需要改成自己安装 MySQL 时设置的密码。

---

## 九、前后端启动顺序

正常开发时，需要同时启动前端和后端。

### 启动后端

打开一个 VSCode 终端：

```bash
cd backend
venv\Scripts\activate
python app.py
```

macOS / Linux 使用：

```bash
source venv/bin/activate
python app.py
```

后端地址：

```text
http://localhost:5000
```

### 启动前端

再打开一个新的 VSCode 终端：

```bash
cd frontend
npm run dev
```

前端地址：

```text
http://localhost:5173
```

---

## 十、前后端接口地址约定

前端请求后端接口的基础地址为：

```text
http://localhost:5000/api
```

前端统一请求文件：

```text
frontend/src/api/request.js
```

示例：

```javascript
import axios from "axios";

const request = axios.create({
  baseURL: "http://localhost:5000/api",
  timeout: 10000,
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default request;
```

之后所有前端接口都应基于这个 `request` 文件封装，不要每个人单独写一套 Axios 配置。

---

## 十一、统一返回格式

后端接口统一返回以下 JSON 格式：

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

成功示例：

```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt_token_here",
    "user": {
      "id": 1,
      "username": "zhangsan",
      "role": "user"
    }
  }
}
```

失败示例：

```json
{
  "code": 400,
  "message": "用户名或密码错误",
  "data": null
}
```

---

## 十二、各成员模块分工建议

### 用户认证模块

主要负责：

```text
注册
登录
JWT 认证
个人信息管理
权限控制
```

主要文件：

```text
backend/routes/auth.py
frontend/src/api/auth.js
frontend/src/pages/Login.jsx
frontend/src/pages/Register.jsx
frontend/src/pages/Profile.jsx
```

### 信息发布管理模块

主要负责：

```text
发布失物/招领信息
编辑信息
删除信息
查看详情
图片上传
物品状态管理
```

主要文件：

```text
backend/routes/items.py
frontend/src/api/items.js
frontend/src/pages/ItemCreate.jsx
frontend/src/pages/ItemDetail.jsx
frontend/src/components/ItemCard.jsx
```

### 搜索与智能匹配模块

主要负责：

```text
关键词搜索
分类筛选
分页排序
智能匹配
相似度计算
推荐结果展示
```

主要文件：

```text
backend/routes/search.py
backend/routes/matches.py
backend/utils/match.py
frontend/src/api/search.js
frontend/src/api/matches.js
frontend/src/pages/Search.jsx
frontend/src/pages/MatchResult.jsx
```

### 认领与审核模块

主要负责：

```text
发起认领申请
查看我的申请
查看待我审核
通过/驳回申请
通知消息
物品状态流转
```

主要文件：

```text
backend/routes/claims.py
backend/routes/notifications.py
frontend/src/api/claims.js
frontend/src/pages/MyClaims.jsx
frontend/src/pages/ReviewClaims.jsx
frontend/src/pages/Notifications.jsx
```

---

## 十三、Git 协作方式

### 1. 每次开发前先拉取最新代码

```bash
git checkout dev
git pull origin dev
```

### 2. 创建自己的功能分支

例如用户认证模块：

```bash
git checkout -b feature-auth
```

信息发布模块：

```bash
git checkout -b feature-items
```

搜索与智能匹配模块：

```bash
git checkout -b feature-search-match
```

认领与审核模块：

```bash
git checkout -b feature-claims
```

### 3. 提交代码

```bash
git add .
git commit -m "feat: 完成某某功能"
```

### 4. 推送到 GitHub

```bash
git push origin feature-auth
```

如果小组决定不使用 PR，也可以直接提交到 `dev` 分支：

```bash
git checkout dev
git pull origin dev
git add .
git commit -m "feat: 完成某某功能"
git push origin dev
```

注意：不建议直接提交到 `main` 分支。`main` 分支建议只保存最终稳定版本。

---

## 十四、不要提交到 GitHub 的文件

以下文件或文件夹不要提交到 GitHub：

```text
frontend/node_modules/
frontend/dist/
backend/venv/
backend/uploads/
__pycache__/
*.pyc
.env
*.env
.DS_Store
Thumbs.db
```

项目根目录的 `.gitignore` 建议包含：

```gitignore
# frontend
frontend/node_modules/
frontend/dist/

# backend
backend/venv/
backend/__pycache__/
backend/uploads/
*.pyc

# env
.env
*.env

# system
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
```

---

## 十五、常见问题

### 1. PowerShell 里执行 SQL 报错

错误示例：

```text
CREATE : 无法将“CREATE”项识别为 cmdlet
```

原因是把 SQL 语句直接写进了 PowerShell。

解决方法：

使用 MySQL Workbench 执行 SQL 文件，或者先进入 MySQL：

```bash
mysql -u root -p
```

看到：

```text
mysql>
```

之后才能执行 SQL。

### 2. 前端启动失败

先确认是否安装了依赖：

```bash
cd frontend
npm install
npm run dev
```

### 3. 后端启动失败

先确认是否激活虚拟环境并安装依赖：

```bash
cd backend
venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### 4. 后端连接数据库失败

检查：

```text
MySQL 是否启动
数据库 lost_found_system 是否已经创建
backend/config.py 里的密码是否正确
数据库端口是否为 3306
```

### 5. Git push 失败

先拉取远程最新代码：

```bash
git pull origin dev
```

如果出现冲突，需要手动解决冲突后再提交。

---

## 十六、最小可运行版本目标

第一阶段先完成最小可运行版本：

```text
1. 用户可以注册
2. 用户可以登录
3. 登录后可以发布失物/招领信息
4. 首页可以展示物品列表
5. 可以搜索物品
6. 可以查看物品详情
7. 可以发起认领申请
8. 发布者可以审核认领申请
9. 审核通过后物品状态变为 claimed
```

智能匹配功能可以作为增强功能，但至少应实现一个简单版本：

```text
根据标题、描述、分类、地点、时间计算相似度，返回 Top 5 推荐结果。
```

---

## 十七、项目运行总结

完整运行项目需要三步：

```text
1. 启动 MySQL，并执行 backend/sql/init.sql 初始化数据库
2. 启动 Flask 后端：python app.py
3. 启动 React 前端：npm run dev
```

前端地址：

```text
http://localhost:5173
```

后端地址：

```text
http://localhost:5000
```

数据库名称：

```text
lost_found_system
```
