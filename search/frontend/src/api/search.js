import request from './request'

export function searchItems(params) {
  return request.get('/search/items', { params })
}

export function getCategories() {
  return request.get('/search/categories')
}
