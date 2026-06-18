import axios from 'axios'

const request = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status
    const responseData = error.response?.data

    // JWT errors return {"msg": "..."} (lowercase msg, no "code" field)
    // Our own API errors return {"code": ..., "message": ...}
    const isJwtError = responseData?.msg && !responseData?.code

    if (status === 401 || (status === 422 && isJwtError)) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Avoid redirect loop if already on login/register page
      if (!window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)

export default request
