import request from "./request"


// ============================================================
// 认领申请
// ============================================================

/** 获取认领模块上下文（用户 + 可认领物品） */
export function getClaimsContext() {
  return request.get("/claims/context")
}

/** 获取可认领物品列表（分页 + 状态筛选） */
export function getClaimItems(params = {}) {
  return request.get("/claims/items", { params })
}

/** 获取用户列表 */
export function getClaimUsers() {
  return request.get("/claims/users")
}

/** 发起认领申请（需 JWT） */
export function createClaim(payload) {
  return request.post("/claims", payload)
}

/** 查看我的申请（分页，需 JWT） */
export function getMyClaims(params = {}) {
  return request.get("/claims/mine", { params })
}

/** 查看待我审核的申请（分页 + 状态筛选，需 JWT） */
export function getReviewClaims(params = {}) {
  return request.get("/claims/review", { params })
}

/** 审核申请（需 JWT） */
export function reviewClaim(claimId, payload) {
  return request.post(`/claims/${claimId}/review`, payload)
}

/** 取消申请（需 JWT） */
export function cancelClaim(claimId) {
  return request.post(`/claims/${claimId}/cancel`)
}


// ============================================================
// 通知
// ============================================================

/** 获取我的通知列表（分页，需 JWT） */
export function getNotifications(params = {}) {
  return request.get("/notifications", { params })
}

/** 获取未读通知数量（需 JWT） */
export function getUnreadCount() {
  return request.get("/notifications/unread-count")
}

/** 标记单条已读（需 JWT） */
export function markAsRead(notificationId) {
  return request.put(`/notifications/${notificationId}/read`)
}

/** 标记全部已读（需 JWT） */
export function markAllAsRead() {
  return request.put("/notifications/read-all")
}

/** 删除单条通知（需 JWT） */
export function deleteNotification(notificationId) {
  return request.delete(`/notifications/${notificationId}`)
}

/** 清空所有通知（需 JWT） */
export function clearNotifications() {
  return request.delete("/notifications/clear")
}
