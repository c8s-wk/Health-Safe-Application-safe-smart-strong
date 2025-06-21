<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import supabase from '../supabase'
import { type Alert, getActiveAlerts } from '../services/sampleAlertService'
import { getCategoryById } from '../services/apiCategory'

const route = useRoute()
const router = useRouter()
const alert = ref<Alert | null>(null)
const loading = ref(true)
const error = ref('')

// Get alert ID from route query
const alertId = computed(() => {
  const id = route.query.id
  return id ? Number(id) : null
})

// Fetch alert details
const fetchAlertDetails = async () => {
  if (!alertId.value) {
    error.value = 'No alert ID provided'
    loading.value = false
    return
  }

  try {
    loading.value = true
    error.value = ''

    // Try to fetch from the database first
    const { data, error: fetchError } = await supabase
      .from('alert')
      .select('*')
      .eq('id', alertId.value)
      .single()

    if (fetchError) {
      console.warn('Error fetching alert from database:', fetchError.message)
      
      // Try to find in active alerts instead
      const activeAlerts = await getActiveAlerts()
      const sampleAlert = activeAlerts.find(a => a.id === alertId.value)
      
      if (sampleAlert) {
        alert.value = sampleAlert
        loading.value = false
        
        return
      }
      
      error.value = `Error fetching alert: ${fetchError.message}`
    } else if (!data) {
      // Also check sample alerts if no data found
      const activeAlerts = await getActiveAlerts()
      const sampleAlert = activeAlerts.find(a => a.id === alertId.value)
      
      if (sampleAlert) {
        alert.value = sampleAlert
        loading.value = false
        return
      }
      
      error.value = 'Alert not found'
    } else {
      alert.value = data
      if (!alert.value) return;
      alert.value.category = (await getCategoryById(data.category_id)).name
    }
  } catch (err) {
    error.value = `Unexpected error: ${(err as Error).message}`
  } finally {
    loading.value = false
  }
}

// Format date
const formatDateTime = (timestamp?: string) => {
  if (!timestamp) return 'No timestamp'
  return new Date(timestamp).toLocaleString()
}

// Get alert color based on category
const getAlertColor = (category?: string) => {
  if (!category) return 'border-gray-400 bg-gray-50'
  
  switch (category.toLowerCase()) {
    case 'health':
      return 'border-red-500 bg-red-50'
    case 'safety':
      return 'border-yellow-500 bg-yellow-50'
    case 'weather':
      return 'border-blue-500 bg-blue-50'
    default:
      return 'border-gray-400 bg-gray-50'
  }
}

// Go back function
const goBack = () => {
  router.back()
}

// Load data when component mounts
onMounted(fetchAlertDetails)
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="mb-4">
      <button 
        @click="goBack" 
        class="flex items-center text-blue-600 hover:text-blue-800"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Alerts
      </button>
    </div>

    <div class="bg-white shadow rounded-lg">
      <div class="px-4 py-5 sm:px-6 border-b border-gray-200">
        <h2 class="text-2xl font-bold text-health-dark">Alert Details</h2>
      </div>

      <div class="px-4 py-5 sm:p-6">
        <!-- Loading state -->
        <div v-if="loading" class="flex justify-center">
          <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="bg-red-50 text-red-700 p-4 rounded-lg">
          {{ error }}
        </div>

        <!-- Alert details -->
        <div v-else-if="alert" class="space-y-6">
          <div 
            class="border-l-4 p-6 rounded-lg"
            :class="getAlertColor(alert.category)"
          >
            <h3 class="text-xl font-semibold">{{ alert.title || 'Alert '+alert.category }}</h3>
            <p class="text-lg mt-2">{{ alert.content || alert.message || 'No content' }}</p>
            
            <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 class="text-sm font-medium text-gray-500">Category</h4>
                <p>{{ alert.category || 'Uncategorized' }}</p>
              </div>
              
              <div>
                <h4 class="text-sm font-medium text-gray-500">Time</h4>
                <p>{{ formatDateTime(alert.created_at) }}</p>
              </div>
              
              <div v-if="alert.location">
                <h4 class="text-sm font-medium text-gray-500">Location</h4>
                <p>{{ alert.location }}</p>
              </div>
              
              <div v-if="alert.latitude && alert.longitude">
                <h4 class="text-sm font-medium text-gray-500">Coordinates</h4>
                <p>{{ alert.latitude.toFixed(4) }}, {{ alert.longitude.toFixed(4) }}</p>
              </div>
            </div>
          </div>

          <!-- Recommended actions -->
          <div class="bg-gray-50 p-6 rounded-lg">
            <h4 class="font-medium text-lg mb-3">Recommended Actions</h4>
            <ul class="list-disc list-inside space-y-2">
              <li v-if="alert.category?.toLowerCase() === 'health'">
                Follow health guidelines and maintain personal hygiene
              </li>
              <li v-if="alert.category?.toLowerCase() === 'weather'">
                Stay indoors and avoid travel if possible
              </li>
              <li v-if="alert.category?.toLowerCase() === 'safety'">
                Stay away from affected areas and follow official instructions
              </li>
              <li>Check official government channels for updates</li>
              <li>Share this information with family and friends</li>
            </ul>
          </div>
        </div>

        <!-- No alert found -->
        <div v-else class="text-center py-8">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900">No alert found</h3>
          <p class="mt-1 text-gray-500">The alert you're looking for doesn't exist or has been removed.</p>
        </div>
      </div>
    </div>
  </div>
</template> 