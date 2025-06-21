<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getLatestAlerts, markAlertAsSeen, Alert as NotificationAlert } from '../services/alertNotificationService'
import { getAlerts, Alert as ApiAlert } from '../services/apiAlert'
import MapPost from './MapPost.vue'
// Combined alert interface to handle both alert types
interface CombinedAlert {
  id: number
  title?: string
  content: string
  category?: string
  category_id?: number
  created_at: string
  expires_at?: string
  user_id?: string | number
  latitude?: number
  longitude?: number
  location?: string
  isOfficial?: boolean
}

const currentAlerts = ref<CombinedAlert[]>([])
const pastAlerts = ref<CombinedAlert[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const activeTab = ref('current')
const showDetailsModal = ref(false)
const selectedAlert = ref<CombinedAlert | null>(null)

const displayedAlerts = computed(() => {
  return activeTab.value === 'current' ? currentAlerts.value : pastAlerts.value
})

// Load alerts from both services
async function loadAlerts() {
  isLoading.value = true
  error.value = null
  try {
    // Get notification alerts
    const notificationAlerts = await getLatestAlerts(50)
    
    // Get system alerts
    const apiAlerts = await getAlerts()
    
    // Process and merge alerts
    const combinedAlerts = [
      ...notificationAlerts.map((alert: NotificationAlert): CombinedAlert => ({
        id: alert.id,
        title: alert.title || 'Alert',
        content: alert.content || alert.message || '',
        category: alert.category || 'general',
        created_at: alert.created_at || new Date().toISOString(),
        user_id: alert.user_id,
        latitude: alert.latitude,
        longitude: alert.longitude,
        location: alert.location,
        isOfficial: true
      })),
      ...apiAlerts.map((alert: ApiAlert): CombinedAlert => ({
        id: alert.id,
        content: alert.content,
        category_id: alert.category_id,
        created_at: alert.created_at,
        user_id: alert.user_id,
        latitude: alert.latitude,
        longitude: alert.longitude,
        isOfficial: false
      }))
    ]

    // Sort combined alerts by date (newest first)
    combinedAlerts.sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    // Filter current (last 24 hours) vs past alerts
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    currentAlerts.value = combinedAlerts.filter(alert => {
      const alertDate = new Date(alert.created_at)
      return alertDate >= yesterday
    })
    
    pastAlerts.value = combinedAlerts.filter(alert => {
      const alertDate = new Date(alert.created_at)
      return alertDate < yesterday
    })
  } catch (e) {
    console.error('Error loading alerts:', e)
    error.value = 'Failed to load alerts. Please try again later.'
  } finally {
    isLoading.value = false
  }
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString('en-SG', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getCategoryColor(alert: CombinedAlert): string {
  if (alert.category) {
    // Handle notification alerts with category strings
    switch (alert.category.toLowerCase()) {
      case 'health': return 'bg-red-100 text-red-800'
      case 'weather': return 'bg-blue-100 text-blue-800'
      case 'safety': return 'bg-orange-100 text-orange-800'
      case 'traffic': return 'bg-yellow-100 text-yellow-800'
      case 'emergency': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  } else if (alert.category_id) {
    // Handle API alerts with category IDs
    switch (alert.category_id) {
      case 1: return 'bg-red-100 text-red-800' // Health
      case 2: return 'bg-blue-100 text-blue-800' // Weather
      case 3: return 'bg-orange-100 text-orange-800' // Safety
      case 4: return 'bg-yellow-100 text-yellow-800' // Traffic
      case 5: return 'bg-purple-100 text-purple-800' // Emergency
      default: return 'bg-gray-100 text-gray-800'
    }
  }
  return 'bg-gray-100 text-gray-800'
}

function getCategoryName(alert: CombinedAlert): string {
  if (alert.category) return alert.category
  
  if (alert.category_id) {
    switch (alert.category_id) {
      case 1: return 'Health'
      case 2: return 'Weather'
      case 3: return 'Safety'
      case 4: return 'Traffic'
      case 5: return 'Emergency'
      default: return 'General'
    }
  }
  
  return 'General'
}

function showAlertDetails(alert: CombinedAlert) {
  selectedAlert.value = alert
  showDetailsModal.value = true
  
  // Mark notification alerts as seen
  if (alert.isOfficial && alert.id) {
    markAlertAsSeen(alert.id)
  }
}

function closeDetailsModal() {
  showDetailsModal.value = false
  selectedAlert.value = null
}

function setActiveTab(tab: string) {
  activeTab.value = tab
}

function refreshAlerts() {
  loadAlerts()
}

onMounted(() => {
  loadAlerts()
})
</script>

<template>
  <div class="alert-history p-4">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-bold">Alert History</h2>
      <button 
        @click="refreshAlerts" 
        class="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center"
        :disabled="isLoading"
      >
        <span v-if="isLoading" class="mr-2">
          <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
        <span>{{ isLoading ? 'Refreshing...' : 'Refresh' }}</span>
      </button>
    </div>
    
    <!-- Tabs -->
    <div class="flex border-b mb-4">
      <button 
        @click="setActiveTab('current')" 
        class="py-2 px-4"
        :class="activeTab === 'current' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'"
      >
        Current Alerts <span class="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full ml-2">{{ currentAlerts.length }}</span>
      </button>
      <button 
        @click="setActiveTab('past')" 
        class="py-2 px-4"
        :class="activeTab === 'past' ? 'border-b-2 border-blue-500 font-medium' : 'text-gray-500'"
      >
        Past Alerts <span class="bg-gray-100 text-gray-800 text-xs px-2 py-0.5 rounded-full ml-2">{{ pastAlerts.length }}</span>
      </button>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center my-8">
      <svg class="animate-spin h-8 w-8 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
      <p>{{ error }}</p>
      <button @click="loadAlerts" class="text-red-700 underline mt-2">Try again</button>
    </div>
    
    <!-- No alerts -->
    <div v-else-if="displayedAlerts.length === 0" class="text-center py-8 text-gray-500">
      <p v-if="activeTab === 'current'">No current alerts</p>
      <p v-else>No past alerts found</p>
    </div>
    
    <!-- Alert list -->
    <div v-else class="space-y-4">
      <div 
        v-for="alert in displayedAlerts" 
        :key="alert.id"
        class="bg-white p-4 rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        @click="showAlertDetails(alert)"
      >
        <div class="flex justify-between items-start">
          <div>
            <div class="flex items-center mb-1">
              <span :class="getCategoryColor(alert)" class="text-xs px-2 py-0.5 rounded-full mr-2">
                {{ getCategoryName(alert) }}
              </span>
              <span v-if="alert.isOfficial" class="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
                Official
              </span>
            </div>
            <h3 class="font-medium text-lg">{{ alert.title || 'Alert' }}</h3>
            <p class="text-gray-600 text-sm clamp-text">{{ alert.content }}</p>
            <div class="flex items-center mt-2 text-gray-500 text-xs">
              <span>{{ formatTime(alert.created_at) }}</span>
              <span v-if="alert.location" class="ml-2">• {{ alert.location }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Alert details modal -->
    <div v-if="showDetailsModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-start mb-4">
          <div class="flex items-center">
            <span v-if="selectedAlert" :class="getCategoryColor(selectedAlert)" class="text-xs px-2 py-0.5 rounded-full mr-2">
              {{ selectedAlert ? getCategoryName(selectedAlert) : '' }}
            </span>
            <span v-if="selectedAlert?.isOfficial" class="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded-full">
              Official
            </span>
          </div>
          <button @click="closeDetailsModal" class="text-gray-500 hover:text-gray-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <h3 class="text-xl font-bold mb-2">{{ selectedAlert?.title || 'Alert' }}</h3>
        
        <div class="mb-4 text-gray-500 text-sm">
          <span>{{ selectedAlert ? formatTime(selectedAlert.created_at) : '' }}</span>
          <span v-if="selectedAlert?.location" class="ml-2">• {{ selectedAlert.location }}</span>
        </div>
        
        <div class="prose mb-4">
          <p>{{ selectedAlert?.content }}</p>
        </div>
        
        <div v-if="selectedAlert?.latitude && selectedAlert?.longitude" class="mt-4">
          <h4 class="font-medium mb-2">Location</h4>
          <div class="bg-gray-100 p-4 rounded">
            <p class="text-sm">Latitude: {{ selectedAlert.latitude }}, Longitude: {{ selectedAlert.longitude }}</p>
            <!-- Map placeholder - could be integrated with an actual map component -->
            <!-- <div class="bg-gray-200 h-48 mt-2 rounded flex items-center justify-center">
              <p class="text-gray-500">Map view would be shown here</p>
            </div> -->
            <MapPost :post="selectedAlert" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.clamp-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 