import request from './request'

export function getItemMatches(itemId, force = false) {
  return request.get(`/matches/item/${itemId}`, { params: { force } })
}

export function triggerMatching(itemId) {
  return request.post(`/matches/trigger/${itemId}`)
}

export function getMyMatches() {
  return request.get('/matches/my')
}
