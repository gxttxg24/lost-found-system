import request from './request'

export const register = (data) => {
  return request.post('/auth/register', data)
}

export const login = (data) => {
  return request.post('/auth/login', data)
}

export const getCurrentUser = () => {
  return request.get('/auth/me')
}

export const updateProfile = (data) => {
  return request.put('/auth/profile', data)
}

export const changePassword = (data) => {
  return request.put('/auth/password', data)
}

export const logout = () => {
  return request.post('/auth/logout')
}
