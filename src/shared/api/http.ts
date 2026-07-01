import axios from 'axios'

// The YouTube Data API v3 client. `adapter: 'fetch'` is important: the extension's
// background is an MV3 service worker with no XMLHttpRequest, so axios must use fetch.
export const http = axios.create({
  baseURL: 'https://www.googleapis.com/youtube/v3',
  adapter: 'fetch',
  timeout: 15000,
})
