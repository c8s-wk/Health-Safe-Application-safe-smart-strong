<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createPost } from '../services/apiPost'
import { Category, getCategories, createCategory } from '../services/apiCategory.ts'
import { useUserStore } from '../stores/userStore'
import LocationPicker from '../components/LocationPicker.vue'

const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY
const router = useRouter()
const userStore = useUserStore()

// Form data
const content = ref('')
const categoryId = ref<number | null>(null)
const selectedLocation = ref<{ lat: number; lng: number } | null>(null)

// Category states
const categories = ref<Category[]>([])
const newCategoryName = ref('')
const showNewCategory = ref(false)

// Loading states
const loadingCategories = ref(false)
const submitting = ref(false)
const errorMessage = ref('')

// Load categories
const loadCategories = async () => {
  try {
    loadingCategories.value = true
    categories.value = await getCategories()
  } catch (error) {
    errorMessage.value = 'Failed to load categories: ' + (error as Error).message
  } finally {
    loadingCategories.value = false
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

// Handle form submission
const handleSubmit = async () => {
  if (!categoryId.value) {
    errorMessage.value = 'Please select a category'
    return
  }

  if (!selectedLocation.value) {
    errorMessage.value = 'Please select a location'
    return
  }

  try {
    submitting.value = true
    await createPost({
      content: content.value,
      category_id: categoryId.value,
      latitude: selectedLocation.value.lat,
      longitude: selectedLocation.value.lng
    })
    router.push('/blog')
  } catch (error) {
    errorMessage.value = 'Submission failed: ' + (error as Error).message
  } finally {
    submitting.value = false
  }
}

// Initial load
onMounted(loadCategories)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-health-dark">Create New Post</h2>
      </div>
      
      <div class="px-4 py-5 sm:p-6">
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Error message -->
          <div v-if="errorMessage" class="bg-red-50 text-red-700 p-4 rounded-lg">
            {{ errorMessage }}
          </div>

          <!-- Content input -->
          <div>
            <label for="content" class="block text-sm font-medium text-gray-700">
              Content *
            </label>
            <textarea
              id="content"
              v-model="content"
              rows="6"
              required
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
              placeholder="Enter post content..."
            ></textarea>
          </div>

          <!-- Category selection -->
          <div class="space-y-2">
            <label class="block text-sm font-medium text-gray-700">
              Category *
            </label>
            
            <!-- Categories list -->
            <div class="grid grid-cols-2 gap-2">
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
                <p class="text-sm text-gray-500 mt-1">
                  Created at {{ new Date(category.created_at).toLocaleDateString() }}
                </p>
              </button>
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

          <!-- Action buttons -->
          <div class="flex justify-end gap-4 pt-6">
            <button
              type="button"
              @click="router.push('/blog')"
              class="btn bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn-primary"
              :disabled="submitting"
            >
              <span v-if="submitting">Submitting...</span>
              <span v-else>Publish Post</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.btn {
  @apply px-4 py-2 rounded-md transition-colors;
}

.btn-primary {
  @apply bg-health-primary text-white hover:bg-health-primary/90;
}

.btn-secondary {
  @apply bg-health-light text-health-primary hover:bg-health-light/80;
}
</style>