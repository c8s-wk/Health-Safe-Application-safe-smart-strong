<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchNews, type NewsArticle } from '../services/apiNews'

const news = ref<NewsArticle[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

onMounted(async () => {
  try {
    const response = await fetchNews()
    news.value = response.articles
  } catch (err) {
    error.value = 'Failed to load news articles'
    console.error('Error:', err)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-health-dark mb-6">Latest Health News</h1>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center min-h-[400px]">
      <div class="animate-spin rounded-full h-12 w-12 border-4 border-health-primary border-t-transparent"></div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-3">
          <p class="text-sm text-red-700">{{ error }}</p>
        </div>
      </div>
    </div>

    <!-- News Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <article
        v-for="article in news"
        :key="article.url"
        class="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
      >
        <div class="h-48 overflow-hidden">
          <img
            :src="article.urlToImage || 'https://via.placeholder.com/400x200?text=No+Image'"
            :alt="article.title"
            class="w-full h-full object-cover"
          >
        </div>
        <div class="p-6 flex-1 flex flex-col">
          <div class="flex items-center mb-2">
            <span class="text-sm text-health-primary font-medium">
              {{ article.source.name }}
            </span>
          </div>
          <h2 class="text-xl font-semibold mb-2 text-health-dark">{{ article.title }}</h2>
          <p class="text-gray-600 mb-4 flex-1">{{ article.description }}</p>
          <div class="mt-auto">
            <div class="flex justify-between items-center pt-4 border-t border-gray-100">
              <span class="text-sm text-gray-500">
                {{ formatDate(article.publishedAt) }}
              </span>
              <a
                :href="article.url"
                target="_blank"
                rel="noopener noreferrer"
                class="text-health-primary hover:text-health-primary/80 text-sm font-medium flex items-center"
              >
                Read More
                <svg class="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>