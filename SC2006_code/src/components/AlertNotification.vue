<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

interface Alert {
  id: number
  title?: string
  content?: string
  message?: string
  category?: string
  created_at?: string
  [key: string]: any
}

const props = defineProps<{
  alert: Alert
  show: boolean
}>()

const emit = defineEmits(['close', 'viewDetails'])

const router = useRouter()
const visible = ref(props.show)

// Watch for changes in the show prop
watch(() => props.show, (newValue) => {
  visible.value = newValue
})

// Handle closing the notification
const closeNotification = () => {
  visible.value = false
  emit('close')
}

// Auto-close after 10 seconds
onMounted(() => {
  if (props.show) {
    setTimeout(() => {
      closeNotification()
    }, 10000) // 10 seconds
  }
})

// Get color based on alert category
const getAlertColor = (category?: string) => {
  if (!category) return 'border-gray-400'
  
  switch (category.toLowerCase()) {
    case 'health':
      return 'border-red-500'
    case 'safety':
      return 'border-yellow-500'
    case 'weather':
      return 'border-blue-500'
    default:
      return 'border-gray-400'
  }
}

// Handle view details
const viewDetails = () => {
  closeNotification()
  emit('viewDetails', props.alert.id)
}

// Format date
const formatDateTime = (timestamp?: string) => {
  if (!timestamp) return 'No timestamp'
  return new Date(timestamp).toLocaleString()
}
</script>

<template>
  <transition name="alert-fade">
    <div 
      v-if="visible"
      class="fixed top-20 right-4 max-w-sm w-full bg-white shadow-lg rounded-lg overflow-hidden z-50 border-l-4"
      :class="getAlertColor(alert.category)"
    >
      <div class="relative p-4">
        <!-- Close button -->
        <button 
          @click="closeNotification" 
          class="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <!-- Alert content -->
        <div>
          <h3 class="font-semibold text-lg">{{ alert.title || 'Alert Notification' }}</h3>
          <p class="text-sm text-gray-700 mt-1">{{ alert.content || alert.message || 'No content' }}</p>
          <div class="text-xs text-gray-500 mt-2">
            <span>{{ formatDateTime(alert.created_at) }}</span>
          </div>
          
          <!-- View Details button -->
          <button 
            @click="viewDetails"
            class="mt-3 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 transition-colors"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.alert-fade-enter-active,
.alert-fade-leave-active {
  transition: all 0.3s ease;
}

.alert-fade-enter-from,
.alert-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style> 