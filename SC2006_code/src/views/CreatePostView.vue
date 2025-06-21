<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createPost } from '../services/apiPost'
import { createCategory, getCategories } from '../services/apiCategory'
import { useUserStore } from '../stores/userStore'
import LocationPicker from '../components/LocationPicker.vue'

const router = useRouter()
const userStore = useUserStore()
const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

// Form data
const title = ref('')
const content = ref('')
const categoryId = ref<number | null>(null)
const categories = ref<{ id: number; name: string; created_at: string }[]>([])
const selectedLocation = ref<{ lat: number; lng: number } | null>(null)
const isSubmitting = ref(false)
const errorMessage = ref('')
const previewMode = ref(false)
const newCategoryName = ref('')
const showNewCategory = ref(false)
// Load categories
const loadCategories = async () => {
  try {
    categories.value = await getCategories()
  } catch (error) {
    errorMessage.value = 'Failed to load categories: ' + (error as Error).message
  }
}
// Create new category
const handleCreateCategory = async () => {
  if (!newCategoryName.value.trim()) return
  
  try {
    await createCategory(newCategoryName.value.trim())
    // Get updated categories and select the newly created one
    categories.value = await getCategories()
    // Find the newly created category (likely the last one)
    const newCategory = categories.value.find(c => c.name === newCategoryName.value.trim())
    if (newCategory) {
      categoryId.value = newCategory.id
    }
    newCategoryName.value = ''
    showNewCategory.value = false
  } catch (error) {
    errorMessage.value = 'Failed to create category: ' + (error as Error).message
  }
}

// Handle location confirmation
const handleLocationConfirm = (location: { lat: number; lng: number }) => {
  selectedLocation.value = location
}

// Toggle preview mode
const togglePreview = () => {
  previewMode.value = !previewMode.value
}

// Submit the post
const submitPost = async () => {
  if (!categoryId.value) {
    errorMessage.value = 'Please select a category'
    return
  }

  if (!content.value.trim()) {
    errorMessage.value = 'Please enter content for your post'
    return
  }

  if (!selectedLocation.value) {
    errorMessage.value = 'Please select a location'
    return
  }

  try {
    isSubmitting.value = true
    
    await createPost({
      content: content.value,
      category_id: categoryId.value,
      latitude: selectedLocation.value.lat,
      longitude: selectedLocation.value.lng
    })
    
    // Redirect to posts page after successful creation
    router.push('/posts')
  } catch (error) {
    errorMessage.value = 'Failed to create post: ' + (error as Error).message
    console.error('Error creating post:', error)
  } finally {
    isSubmitting.value = false
  }
}

// Cancel and go back
const cancel = () => {
  router.push('/posts')
}

// Load categories on mount
onMounted(loadCategories)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white rounded-lg shadow-md overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h1 class="text-2xl font-bold text-gray-900">Create New Post</h1>
          <div class="flex items-center space-x-2">
            <button 
              @click="togglePreview" 
              class="px-3 py-1 text-sm rounded-md border"
              :class="previewMode ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-gray-100 border-gray-300'"
            >
              {{ previewMode ? 'Edit Mode' : 'Preview' }}
            </button>
            <button @click="cancel" class="text-gray-500 hover:text-gray-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Form or Preview -->
      <div>
        <!-- Error message -->
        <div v-if="errorMessage" class="bg-red-50 text-red-700 p-4 mx-6 mt-4 rounded-lg">
          {{ errorMessage }}
        </div>
        
        <!-- Preview mode -->
        <div v-if="previewMode" class="p-6">
          <div class="border rounded-lg p-4">
            <div class="mb-4">
              <span class="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                {{ categories.find(c => c.id === categoryId)?.name || 'No category' }}
              </span>
            </div>
            <div class="prose max-w-none">
              <p class="whitespace-pre-line text-gray-700">{{ content || 'Post content will appear here' }}</p>
            </div>
            <div v-if="selectedLocation" class="text-xs text-gray-500 mt-4">
              Location: {{ selectedLocation.lat.toFixed(6) }}, {{ selectedLocation.lng.toFixed(6) }}
            </div>
            <div class="mt-6 text-right">
              <button 
                @click="togglePreview" 
                class="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                Continue Editing
              </button>
            </div>
          </div>
        </div>
        
        <!-- Edit mode -->
        <form v-else @submit.prevent="submitPost" class="p-6 space-y-6">
          <!-- Content -->
          <div>
            <label for="content" class="block text-sm font-medium text-gray-700 mb-1">Content *</label>
            <textarea
              id="content"
              v-model="content"
              rows="8"
              placeholder="Write your post content here..."
              class="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-health-primary"
            ></textarea>
          </div>
          
          <!-- Category selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
              <button
                v-for="category in categories"
                :key="category.id"
                type="button"
                :class="[
                  'p-3 rounded-lg border text-left',
                  categoryId === category.id
                    ? 'border-health-primary bg-health-light'
                    : 'border-gray-200 hover:border-health-primary'
                ]"
                @click="categoryId = category.id"
              >
                <h3 class="font-medium">{{ category.name }}</h3>
              </button>
            </div>
          </div>

          <!-- New category creation -->
          <div class="pt-4 border-t mt-4">
              <button
                type="button"
                class="text-health-primary hover:text-health-primary/80 flex items-center"
                @click="showNewCategory = !showNewCategory"
              >
                <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                </svg>
                Create New Category
              </button>

              <div v-if="showNewCategory" class="mt-4 flex gap-2">
                <input
                  v-model="newCategoryName"
                  type="text"
                  class="flex-1 rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
                  placeholder="New category name"
                >
                <button
                  type="button"
                  class="btn btn-secondary"
                  @click="handleCreateCategory"
                >
                  Create
                </button>
              </div>
            </div>
          
          <!-- Location picker -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Location *
            </label>
            <div v-if="selectedLocation">
              <p>Lat: {{ selectedLocation.lat }}</p>
              <p>Lng: {{ selectedLocation.lng }}</p>
            </div>
            <div class="border rounded-lg overflow-hidden">
              <LocationPicker
                v-model="selectedLocation"
                :api-key="apiKey"
                @confirm="handleLocationConfirm"
              />
            </div>
          </div>
          
          <!-- Submit buttons -->
          <div class="flex justify-end space-x-2 pt-4 border-t">
            <button
              type="button"
              @click="togglePreview"
              class="px-4 py-2 border border-blue-300 rounded-md text-blue-700 bg-blue-50 hover:bg-blue-100"
            >
              Preview
            </button>
            <button
              type="button"
              @click="cancel"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="bg-health-primary text-white px-4 py-2 rounded-md hover:bg-health-primary/90"
              :disabled="isSubmitting"
            >
              <span v-if="isSubmitting">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 inline-block text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
              <span v-else>Create Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template> 