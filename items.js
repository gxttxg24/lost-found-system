import request from '../api/request'

export function createItem(payload) {
  return request.post('/items', payload)
}

export function getItems(params) {
  return request.get('/items', { params })
}

export function getItem(id) {
  return request.get(`/items/${id}`)
}

export function updateItem(id, payload) {
  return request.put(`/items/${id}`, payload)
}

export function deleteItem(id) {
  return request.delete(`/items/${id}`)
}

export function uploadItemImage(id, file) {
  const form = new FormData()
  form.append('file', file)
  return request.post(`/items/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}
