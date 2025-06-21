<script setup lang="ts">
import { ref, computed, onMounted, onActivated } from 'vue'
import { useRouter, RouterLink } from 'vue-router'
import { getPosts, type Post } from '../services/apiPost'
import { useUserStore } from '../stores/userStore'
import { getCategories, type Category } from '../services/apiCategory'
import { getReactionCount } from '../services/apiReaction'
import { seedSamplePosts, hasExistingPosts } from '../services/postSeeder'
import { ensureAndGetCategories } from '../services/categorySeeder'
import { createReport, hasReported } from '../services/apiReport'
import supabase from '../supabase'
import { getProfile, Profile } from '../services/apiProfile'

// Define component name for keep-alive
defineOptions({
  name: 'PostsView'
})

const router = useRouter()
const userStore = useUserStore()
const posts = ref<Post[]>([])
const searchQuery = ref('')
const selectedCategory = ref<string>('')
const isLoading = ref(true)
const error = ref<string | null>(null)

// Category information
const categories = ref<string[]>([])
const categoryNames = ref<Record<number, string>>({})
const categoriesData = ref<Category[]>([])

// Reaction and comment counts
const postLikeCounts = ref<Record<number, number>>({})
const postDislikeCounts = ref<Record<number, number>>({})
const postCommentCounts = ref<Record<number, number>>({})

// Add a function to seed sample posts
const isSeeding = ref(false)
const seedingError = ref<string | null>(null)

// Report functionality
const showReportModal = ref(false)
const currentPostToReport = ref<Post | null>(null)
const reportReason = ref('')
const reportDetails = ref('')
const isReportSubmitting = ref(false)
const reportError = ref<string | null>(null)
const reportSuccess = ref(false)
const userReportedPosts = ref<Record<number, boolean>>({})

// Get category by ID - implemented locally since not available in the service
const getCategoryById = async (id: number): Promise<Category> => {
  // Check if we already have the categories loaded
  if (categoriesData.value.length > 0) {
    const category = categoriesData.value.find(c => c.id === id)
    if (category) return category
  }
  
  // If not found in our cache, fetch from the database
  const { data, error } = await supabase
    .from('category')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    console.error('Error fetching category:', error)
    throw new Error(`Category with ID ${id} not found`)
  }
  
  return data
}

// Load posts from service
const loadPosts = async () => {
  isLoading.value = true
  error.value = null
  
  try {
    // Load all categories first - using ensureAndGetCategories to ensure categories exist
    categoriesData.value = await ensureAndGetCategories()
    
    // Get posts from the backend - first 100 posts (adjust as needed)
    const fetchedPosts = await getPosts(0, 99)
    posts.value = fetchedPosts
    
    // Extract unique category IDs
    const categoryIds = [...new Set(fetchedPosts.map(post => post.category_id))]
    
    // Get category names for each category ID
    for (const categoryId of categoryIds) {
      try {
        const category = await getCategoryById(categoryId)
        categoryNames.value[categoryId] = category.name
      } catch (err) {
        console.error(`Error fetching category ${categoryId}:`, err)
        categoryNames.value[categoryId] = `Category ${categoryId}`
      }
    }
    
    // Extract unique category names
    categories.value = Object.values(categoryNames.value).sort()
    
    // Load like and comment counts for each post
    await loadLikeAndCommentCounts()
  } catch (err) {
    console.error('Error loading posts:', err)
    error.value = 'Failed to load posts. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

// Load like and comment counts for all posts
const loadLikeAndCommentCounts = async () => {
  try {
    // Fetch like counts, dislike counts and comments for each post
    const likePromises = posts.value.map(post => getReactionCount("LIKE", post.id, "POST"))
    const dislikePromises = posts.value.map(post => getReactionCount("DISLIKE", post.id, "POST"))
    
    // Get comments from the database
    const commentsPromises = posts.value.map(async post => {
      const { data, error } = await supabase
        .from('comment')
        .select('*')
        .eq('target_id', post.id)
        .eq('target_type', 'POST')
      
      if (error) {
        console.error(`Error fetching comments for post ${post.id}:`, error)
        throw error
      }
      return data || []
    })
    
    const likeCounts = await Promise.all(likePromises)
    const dislikeCounts = await Promise.all(dislikePromises)
    const commentResults = await Promise.all(commentsPromises)
    
    console.log('Refreshed reaction counts for posts')
    
    // Store like counts in an object keyed by post ID
    posts.value.forEach((post, index) => {
      postLikeCounts.value[post.id] = likeCounts[index]
      postDislikeCounts.value[post.id] = dislikeCounts[index]
      postCommentCounts.value[post.id] = commentResults[index].length
    })
  } catch (err) {
    console.error('Error loading reaction and comment counts:', err)
  }
}

// Filter posts based on search query and category
const filteredPosts = computed(() => {
  return posts.value.filter(post => {
    // Match search query
    const matchesSearch = searchQuery.value === '' || 
      post.content.toLowerCase().includes(searchQuery.value.toLowerCase())
    
    // Match category
    const matchesCategory = selectedCategory.value === '' || 
      categoryNames.value[post.category_id] === selectedCategory.value
    
    return matchesSearch && matchesCategory
  })
})

// Format date for display
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Navigate to create post page
const createNewPost = async () => {
  const profile:Profile=await getProfile()
  if(profile.type=="RESTRICTED") {
    alert("You are not authorized to create posts.")
    return
  }
  router.push('/posts/create')
}

// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  selectedCategory.value = ''
}

// Get category name for a post
const getCategoryName = (categoryId: number): string => {
  return categoryNames.value[categoryId] || 'Uncategorized'
}

// Navigate to post detail page
const viewPostDetails = (postId: number) => {
  console.log('Navigating to post details for ID:', postId)
  const path = `/posts/${postId}`
  console.log('Navigating to path:', path)
  router.push(path)
}

// Add a function to seed sample posts
const seedPosts = async () => {
  try {
    isSeeding.value = true
    seedingError.value = null
    await seedSamplePosts()
    // Reload posts after seeding
    await loadPosts()
  } catch (err) {
    console.error('Error seeding posts:', err)
    seedingError.value = 'Failed to seed sample posts. Please try again.'
  } finally {
    isSeeding.value = false
  }
}

// Check report status for all posts
const checkReportStatus = async () => {
  console.log('Checking report status for all posts...')
  
  try {
    // For each post, check if the user has reported it
    const checkPromises = posts.value.map(async post => {
      try {
        const hasUserReported = await hasReported(post.id)
        console.log(`Post ${post.id} reported status: ${hasUserReported}`)
        userReportedPosts.value[post.id] = hasUserReported
        return { postId: post.id, reported: hasUserReported }
      } catch (err) {
        console.error(`Error checking report status for post ${post.id}:`, err)
        return { postId: post.id, reported: false, error: true }
      }
    })
    
    // Wait for all checks to complete
    const results = await Promise.all(checkPromises)
    console.log('Report status check complete:', results)
    
  } catch (err) {
    console.error('Error checking report status:', err)
  }
}

// Open report modal
const openReportModal = (post: Post, event: Event) => {
  // Prevent the click from propagating to the post card
  event.stopPropagation()
  
  if (!userStore.user) {
    const confirmLogin = window.confirm('You need to be logged in to report posts. Would you like to log in now?')
    if (confirmLogin) {
      router.push('/login?redirect=' + encodeURIComponent(router.currentRoute.value.fullPath))
    }
    return
  }
  
  currentPostToReport.value = post
  reportReason.value = ''
  reportDetails.value = ''
  reportError.value = null
  reportSuccess.value = false
  showReportModal.value = true
}

// Close report modal
const closeReportModal = () => {
  showReportModal.value = false
  currentPostToReport.value = null
}

// Submit report
const submitReport = async () => {
  if (!currentPostToReport.value) return
  
  if (!reportReason.value) {
    reportError.value = 'Please select a reason for reporting.'
    return
  }
  
  try {
    isReportSubmitting.value = true
    reportError.value = null
    
    const result = await createReport({
      post_id: currentPostToReport.value.id,
      reason: reportReason.value,
      details: reportDetails.value || undefined
    })
    
    console.log('Report submitted successfully:', result)
    reportSuccess.value = true
    userReportedPosts.value[currentPostToReport.value.id] = true
    
    // Auto-close modal after success
    setTimeout(() => {
      closeReportModal()
      // Force check report status for all posts
      checkReportStatus()
    }, 2000)
  } catch (err) {
    console.error('Error submitting report:', err)
    reportError.value = err instanceof Error ? err.message : 'Failed to submit report'
  } finally {
    isReportSubmitting.value = false
  }
}

onMounted(() => {
  console.log('PostsView mounted - loading posts and checking report status')
  
  // First load posts
  loadPosts().then(() => {
    console.log(`Loaded ${posts.value.length} posts, now checking report status`)
    // Check report status for all posts after posts are loaded
    return checkReportStatus()
  }).catch(err => {
    console.error('Error during post loading or report checking:', err)
  })
})

// Add onActivated hook to refresh data when navigating back to this view
onActivated(() => {
  console.log('PostsView activated - refreshing data')
  
  // Only refresh if we have posts loaded
  if (posts.value.length > 0) {
    console.log('Refreshing post data and report status')
    
    // Run these operations in parallel
    Promise.all([
      loadLikeAndCommentCounts(),
      checkReportStatus()
    ]).catch(err => {
      console.error('Error refreshing post data:', err)
    })
  } else {
    console.log('No posts loaded, running full loadPosts')
    loadPosts().then(() => checkReportStatus())
  }
})
</script>

<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-8">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-3xl font-bold text-gray-900">Health Community Posts</h1>
        <div class="flex space-x-2">
          <button 
            @click="createNewPost"
            class="btn bg-health-primary text-white px-4 py-2 rounded-md hover:bg-health-primary/90"
          >
            Create Post
          </button>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-4 mb-6">
        <div class="w-full md:w-auto flex-grow">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search posts..."
            class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
          />
        </div>
        <div class="w-full md:w-auto">
          <select
            v-model="selectedCategory"
            class="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
          >
            <option value="">All Categories</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </select>
        </div>
        <button
          v-if="searchQuery || selectedCategory"
          @click="clearFilters"
          class="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center"
          title="Clear all filters"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Clear Filters
        </button>
      </div>
      
      <!-- Active Filters -->
      <div v-if="searchQuery || selectedCategory" class="mb-6">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-sm font-medium text-gray-700">Active Filters:</span>
          
          <div v-if="searchQuery" class="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm flex items-center">
            <span>Search: "{{ searchQuery }}"</span>
            <button @click="searchQuery = ''" class="ml-2 text-blue-700 hover:text-blue-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div v-if="selectedCategory" class="px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm flex items-center">
            <span>Category: {{ selectedCategory }}</span>
            <button @click="selectedCategory = ''" class="ml-2 text-green-700 hover:text-green-900">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center py-12">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-health-primary"></div>
    </div>

    <div v-else-if="error" class="text-center py-12">
      <p class="text-xl text-red-500 mb-4">{{ error }}</p>
      <button @click="loadPosts" class="btn bg-health-primary text-white px-4 py-2 rounded-md">
        Try Again
      </button>
    </div>

    <div v-else-if="filteredPosts.length === 0" class="text-center py-12">
      <p class="text-xl text-gray-500 mb-4">No posts found. Try adjusting your search or category filters.</p>
      
      <!-- Add the seed button here -->
      <div v-if="posts.length === 0" class="mt-6">
        <p class="text-base text-gray-500 mb-4">Would you like to add some sample posts?</p>
        <button 
          @click="seedPosts" 
          class="btn bg-health-primary text-white px-4 py-2 rounded-md"
          :disabled="isSeeding"
        >
          <span v-if="isSeeding" class="flex items-center">
            <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Seeding Sample Posts...
          </span>
          <span v-else>Seed Sample Posts</span>
        </button>
        <p v-if="seedingError" class="text-red-500 mt-2">{{ seedingError }}</p>
      </div>
    </div>

    <!-- Results count -->
    <div v-else class="mb-4">
      <p class="text-sm text-gray-500">
        Showing {{ filteredPosts.length }} {{ filteredPosts.length === 1 ? 'post' : 'posts' }}
      </p>
    </div>

    <div v-if="!isLoading && filteredPosts.length > 0" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <!-- Post card -->
      <div 
        v-for="post in filteredPosts" 
        :key="post.id"
        class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-200 hover:border-health-primary relative cursor-pointer"
        @click="viewPostDetails(post.id)"
      >
        <!-- Card content -->
        <div class="p-6">
          <div class="flex justify-between items-start mb-2">
            <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
              {{ getCategoryName(post.category_id) }}
            </span>
          </div>
          
          <p class="text-gray-600 mb-4 line-clamp-1">{{ post.content.split('\n')[0] }}</p>
          
          <div class="flex justify-between items-center text-sm text-gray-500">
            <div v-if="post.user_id" class="flex items-center">
              <span class="font-medium">User ID: {{ post.user_id.substring(0, 8) }}...</span>
            </div>
            <span>{{ formatDate(post.created_at) }}</span>
          </div>
          
          <div v-if="post.latitude && post.longitude" class="flex items-center mt-4 text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Location: {{ post.latitude.toFixed(4) }}, {{ post.longitude.toFixed(4) }}
          </div>
          
          <!-- Post engagement stats -->
          <div class="flex items-center mt-4 pt-4 border-t border-gray-100">
            <div class="flex items-center mr-4 text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
              </svg>
              {{ postLikeCounts[post.id] || 0 }}
            </div>
            
            <div class="flex items-center mr-4 text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-red-500" fill="currentColor" viewBox="0 0 24 24" stroke="none">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
              </svg>
              {{ postDislikeCounts[post.id] || 0 }}
            </div>
            
            <div class="flex items-center text-sm text-gray-500 mr-auto">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {{ postCommentCounts[post.id] || 0 }}
            </div>

            <!-- Report Button or Reported Status -->
            <div v-if="userStore.user" class="text-sm">
              <span 
                v-if="userReportedPosts[post.id]" 
                class="text-gray-500 px-2 py-1 bg-gray-100 rounded-md text-xs"
                title="You have reported this post"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Reported
              </span>
              <button 
                v-else
                @click="openReportModal(post, $event)"
                class="text-gray-500 hover:text-red-500 px-2 py-1 hover:bg-gray-100 rounded-md text-xs transition-colors"
                title="Report this post"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report
              </button>
            </div>
          </div>
          
          <!-- View post button -->
          <div class="text-center mt-4">
            <button 
              @click.stop="viewPostDetails(post.id)"
              class="inline-block px-4 py-2 bg-health-primary text-white rounded-md w-full hover:bg-health-primary/90 transition-all"
            >
              View Post Details
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Report Modal -->
  <div v-if="showReportModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-start mb-4">
        <h2 class="text-xl font-bold text-gray-900">Report Post</h2>
        <button @click="closeReportModal" class="text-gray-400 hover:text-gray-500">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div v-if="reportSuccess" class="bg-green-50 text-green-700 p-4 rounded-md mb-4">
        <p class="font-medium">Report submitted successfully!</p>
        <p class="text-sm mt-1">Thank you for helping keep our community safe.</p>
      </div>
      
      <div v-else>
        <p class="mb-4 text-gray-600">
          Please help us understand what's wrong with this post. Your report will be reviewed by our moderation team.
        </p>
        
        <div class="space-y-4">
          <div>
            <label for="report-reason" class="block text-sm font-medium text-gray-700 mb-1">
              Reason for reporting*
            </label>
            <select 
              id="report-reason"
              v-model="reportReason" 
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
            >
              <option value="">-- Select a reason --</option>
              <option value="SPAM">Spam</option>
              <option value="OFFENSIVE">Offensive content</option>
              <option value="HARASSMENT">Harassment</option>
              <option value="MISLEADING">False or misleading information</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
          
          <div>
            <label for="report-details" class="block text-sm font-medium text-gray-700 mb-1">
              Additional details (optional)
            </label>
            <textarea
              id="report-details"
              v-model="reportDetails"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
              placeholder="Please provide any additional information that might help us understand the issue."
            ></textarea>
          </div>
          
          <div v-if="reportError" class="bg-red-50 text-red-700 p-3 rounded-md">
            {{ reportError }}
          </div>
          
          <div class="flex justify-end space-x-3">
            <button 
              @click="closeReportModal" 
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button 
              @click="submitReport" 
              class="px-4 py-2 bg-health-primary text-white rounded-md hover:bg-health-primary/90"
              :disabled="isReportSubmitting"
            >
              <span v-if="isReportSubmitting" class="flex items-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
              <span v-else>Submit Report</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply rounded-md transition-colors;
}

.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Card hover effect */
.grid > div {
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.grid > div:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}
</style>