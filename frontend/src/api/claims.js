import request from './request'

export const getClaimsContext = () => request.get('/claims/context')
export const getClaimItems = (params = {}) => request.get('/claims/items', { params })
export const createClaim = (payload) => request.post('/claims', payload)
export const getMyClaims = (params = {}) => request.get('/claims/mine', { params })
export const getReviewClaims = (params = {}) => request.get('/claims/review', { params })
export const getItemClaims = (itemId, params = {}) => request.get(`/claims/item/${itemId}`, { params })
export const reviewClaim = (claimId, payload) => request.post(`/claims/${claimId}/review`, payload)
export const approveClaim = (claimId) => request.post(`/claims/${claimId}/review`, { action: 'approve' })
export const rejectClaim = (claimId, payload = {}) =>
  request.post(`/claims/${claimId}/review`, { action: 'reject', review_comment: payload.reason || '' })
export const cancelClaim = (claimId) => request.post(`/claims/${claimId}/cancel`)

export const getNotifications = (params = {}) => request.get('/notifications', { params })
export const getUnreadCount = () => request.get('/notifications/unread-count')
export const markAsRead = (id) => request.put(`/notifications/${id}/read`)
export const markAllAsRead = () => request.put('/notifications/read-all')
export const markNotificationRead = (id) => request.put(`/notifications/${id}/read`)
export const markAllRead = () => request.put('/notifications/read-all')
export const deleteNotification = (id) => request.delete(`/notifications/${id}`)
export const clearNotifications = () => request.delete('/notifications/clear')
