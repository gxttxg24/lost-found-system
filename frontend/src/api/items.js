import request from './request'

export const createItem = (data) => request.post('/items', data)
export const getItems = (params) => request.get('/items', { params })
export const getItem = (id) => request.get(`/items/${id}`)
export const updateItem = (id, data) => request.put(`/items/${id}`, data)
export const deleteItem = (id) => request.delete(`/items/${id}`)

export const getMyItems = (params = {}) => request.get('/items/mine', { params })

export const uploadItemImage = (id, file) => {
  const form = new FormData()
  form.append('file', file)
  return request.post(`/items/${id}/images`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
}
