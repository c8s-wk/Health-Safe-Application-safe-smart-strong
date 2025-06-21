import axios from 'axios'

const API_KEY = '1723b99c60784108965163017678698d'
const BASE_URL = 'https://newsapi.org/v2'

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-Api-Key': API_KEY
  }
})

export interface NewsArticle {
  source: {
    id: string | null
    name: string
  }
  author: string | null
  title: string
  description: string | null
  url: string
  urlToImage: string | null
  publishedAt: string
  content: string | null
}

export interface NewsResponse {
  status: string
  totalResults: number
  articles: NewsArticle[]
}

export const fetchNews = async (): Promise<NewsResponse> => {
  try {
    const response = await axiosInstance.get('/top-headlines', {
      params: {
        country: 'us'
      }
    })
    return response.data
  } catch (error) {
    console.error('Error fetching news:', error)
    throw error
  }
}