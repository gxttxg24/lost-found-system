# feature-claim 分支改动说明

## 分支信息
- **分支名**: `feature-claim`
- **负责模块**: 认领与审核
- **负责人**: 鲁沈杭
- **基于**: `dev` 分支

---

## 改动文件清单

### 后端

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `backend/app.py` | 修改 | 新增 `notifications_bp` 注册（第5-6、16行） |
| `backend/routes/claims.py` | 重写 | 认领CRUD + 分页 + 取消认领 + JWT认证 |
| `backend/routes/notifications.py` | 新建 | 通知模块：列表/未读数/标记已读/删除/清空 + JWT |

### 前端

| 文件 | 改动类型 | 说明 |
|------|----------|------|
| `frontend/src/api/claims.js` | 新建 | 认领API + 通知API 全部封装 |
| `frontend/src/pages/MyClaims.jsx` | 新建 | 我的申请页（分页 + 取消） |
| `frontend/src/pages/ReviewClaims.jsx` | 新建 | 审核管理页（分页 + 通过/驳回） |
| `frontend/src/pages/Notifications.jsx` | 新建 | 通知页（已读/删除/清空 + 分页） |

---

## 新增API接口

### 认领（/api/claims）

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/claims/context` | 无 | 获取表单下拉数据 |
| GET | `/api/claims/items` | 无 | 可认领物品列表（分页） |
| GET | `/api/claims/users` | 无 | 用户列表 |
| POST | `/api/claims` | JWT | 发起认领申请 |
| GET | `/api/claims/mine` | JWT | 我的申请（分页） |
| GET | `/api/claims/review` | JWT | 待我审核（分页+筛选） |
| POST | `/api/claims/<id>/review` | JWT | 通过/驳回申请 |
| POST | `/api/claims/<id>/cancel` | JWT | 取消申请 |

### 通知（/api/notifications）

| 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|
| GET | `/api/notifications` | JWT | 通知列表（分页） |
| GET | `/api/notifications/unread-count` | JWT | 未读数量 |
| PUT | `/api/notifications/<id>/read` | JWT | 标记已读 |
| PUT | `/api/notifications/read-all` | JWT | 全部已读 |
| DELETE | `/api/notifications/<id>` | JWT | 删除单条 |
| DELETE | `/api/notifications/clear` | JWT | 清空全部 |

---

## 注意事项

1. **JWT 认证**：所有写操作接口都用了 `@jwt_required()`，前端需要在请求头带 `Authorization: Bearer <token>`
2. **分页**：列表接口支持 `?page=1&page_size=10`，返回 `total`、`total_pages`
3. **app.py 改动**：只在第5-6行和第15-16行各加了一行 import 和 register_blueprint，合并时选 `keep both` 即可
4. **App.jsx 未动**：前端总路由需要另一个人统一整合
5. **auth.py 依赖**：本模块依赖 JWT，需要成员A先完成登录注册接口

---

## 合并检查清单

- [ ] `app.py`：确认 claims_bp 和 notifications_bp 都已注册
- [ ] `requirements.txt`：确认 `flask-jwt-extended` 已在依赖中
- [ ] 数据库：`claim_requests` 和 `notifications` 表已建（init.sql 中已有）
- [ ] 前端 `App.jsx`：后续整合时加入本模块的 4 个页面组件
