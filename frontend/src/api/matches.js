import request from './request'

export const getItemMatches = (itemId, force = false) =>
  request.get(`/matches/item/${itemId}`, { params: { force } })

export const getMatchResults = (itemId) =>
  request.get(`/matches/item/${itemId}`)

export const triggerMatching = (itemId) =>
  request.post(`/matches/trigger/${itemId}`)

export const triggerMatch = (itemId) =>
  request.post(`/matches/trigger/${itemId}`)

export const getMyMatches = () => request.get('/matches/my')
