import request from './request'

export const searchItems = (params) => request.get('/search/items', { params })
export const getCategories = () => request.get('/search/categories')
