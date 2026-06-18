import request from './request'

export const register = (data) => request.post('/auth/register', data)
export const login = (data) => request.post('/auth/login', data)
export const getCurrentUser = () => request.get('/auth/me')
export const updateProfile = (data) => request.put('/auth/profile', data)
export const changePassword = (data) => request.put('/auth/password', data)
export const logout = () => request.post('/auth/logout')
