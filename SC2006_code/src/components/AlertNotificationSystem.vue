<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../supabase'
import { getActiveAlerts } from '../services/sampleAlertService'

interface NotificationAlert {
  id: number
  title: string
  content: string
  category: string
  created_at: string
  seen?: boolean
}

const router = useRouter()
const notifications = ref<NotificationAlert[]>([])
const seenAlerts = ref<Record<number, boolean>>({})
const dismissedAlerts = ref<Record<number, boolean>>({})
const selectedAlert = ref<NotificationAlert | null>(null)
const showDetailsModal = ref(false)

// Load seen and dismissed alerts from localStorage
const loadStoredAlertState = () => {
  const storedSeen = localStorage.getItem('seenAlerts')
  if (storedSeen) {
    seenAlerts.value = JSON.parse(storedSeen)
  }
  
  const storedDismissed = localStorage.getItem('dismissedAlerts')
  if (storedDismissed) {
    dismissedAlerts.value = JSON.parse(storedDismissed)
  }
}

// Save alert states to localStorage
const saveAlertState = () => {
  localStorage.setItem('seenAlerts', JSON.stringify(seenAlerts.value))
  localStorage.setItem('dismissedAlerts', JSON.stringify(dismissedAlerts.value))
}

// Mark alert as seen (but still visible)
const markAsSeen = (alertId: number) => {
  seenAlerts.value[alertId] = true
  saveAlertState()
}

// Dismiss alert (remove from notifications)
const dismissAlert = (alertId: number) => {
  dismissedAlerts.value[alertId] = true
  saveAlertState()
  
  // Remove from notifications after a delay
  setTimeout(() => {
    notifications.value = notifications.value.filter(alert => alert.id !== alertId)
  }, 300)
}

// View alert details
const viewAlertDetails = (alert: NotificationAlert, event: Event) => {
  event.stopPropagation() // Prevent triggering the parent click event
  markAsSeen(alert.id) // Mark as seen but don't dismiss
  selectedAlert.value = alert
  showDetailsModal.value = true
}

const closeDetailsModal = () => {
  showDetailsModal.value = false
  selectedAlert.value = null
}

// Load active alerts and filter out ones we've already dismissed
const checkForNewAlerts = async () => {
  console.log('checkForNewAlerts called - checking for new alerts')
  
  try {
    // First check if there's a demo alert in sessionStorage
    const demoAlertJson = sessionStorage.getItem('demoAlert')
    if (demoAlertJson) {
      try {
        const demoAlert = JSON.parse(demoAlertJson)
        console.log('Found demo alert in sessionStorage:', demoAlert)
        
        // Remove from sessionStorage to prevent showing it multiple times
        sessionStorage.removeItem('demoAlert')
        
        // Skip if already dismissed
        if (dismissedAlerts.value[demoAlert.id]) {
          console.log('Demo alert was already dismissed, skipping')
          return
        }
        
        // Skip if already showing
        if (notifications.value.some(n => n.id === demoAlert.id)) {
          console.log('Demo alert is already showing, skipping')
          return
        }

        // Skip if demo alert is older than 2 hours
        const alertTime = new Date(demoAlert.created_at || new Date()).getTime()
        const twoHoursAgo = new Date().getTime() - (2 * 60 * 60 * 1000)
        if (alertTime < twoHoursAgo) {
          console.log('Demo alert is older than 2 hours, skipping')
          return
        }
        
        console.log('Adding demo alert to notifications:', demoAlert)
        
        // Create a new alert notification
        const alertToShow = {
          id: demoAlert.id,
          title: demoAlert.title || 'Alert',
          content: demoAlert.content || demoAlert.message || 'New alert',
          category: demoAlert.category || 'General',
          created_at: demoAlert.created_at || new Date().toISOString()
        }
        
        // Add to notifications array to display it
        notifications.value = [...notifications.value, alertToShow]
        console.log('Current notifications:', notifications.value)
        
        // Force notification to be visible for 10 seconds
        setTimeout(() => {
          if (notifications.value.some(n => n.id === demoAlert.id)) {
            console.log('Auto-dismissing demo alert after timeout')
            dismissAlert(demoAlert.id)
          }
        }, 10000)
        
        return // Skip regular fetch if we just showed a demo alert
      } catch (err) {
        console.error('Error parsing demo alert from sessionStorage:', err)
      }
    }
    
    console.log('No demo alert found, checking database or sample alerts')
    const alerts = await getActiveAlerts()
    console.log('Active alerts from service:', alerts)
    
    // Filter for alerts we haven't dismissed yet and are within 2 hours
    const twoHoursAgo = new Date().getTime() - (2 * 60 * 60 * 1000)
    const newAlerts = alerts.filter(alert => {
      const alertTime = new Date(alert.created_at).getTime()
      return !dismissedAlerts.value[alert.id] && alertTime > twoHoursAgo
    })
    console.log('Filtered new alerts (not dismissed and within 2 hours):', newAlerts)
    
    // Add new alerts to notifications if they're not already there
    if (newAlerts.length > 0) {
      // Get IDs of currently showing notifications
      const currentIds = notifications.value.map(n => n.id)
      
      // Only add alerts that aren't already showing
      const alertsToAdd = newAlerts.filter(alert => !currentIds.includes(alert.id))
      console.log('Alerts to add to notification panel:', alertsToAdd)
      
      if (alertsToAdd.length > 0) {
        notifications.value = [
          ...notifications.value,
          ...alertsToAdd.map(alert => ({
            id: alert.id,
            title: alert.title || 'Alert',
            content: alert.content || alert.message || 'New alert',
            category: alert.category || 'General',
            created_at: alert.created_at
          }))
        ]
        console.log('Updated notifications list:', notifications.value)
      }
    }
  } catch (error) {
    console.error('Error checking for alerts:', error)
  }
}

// Real-time subscription to new alerts
let subscription: any = null

const subscribeToAlerts = async () => {
  subscription = supabase
    .channel('public:alert')
    .on(
      'postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'alert' }, 
      (payload: { new: any }) => {
        // Check if we've already dismissed this alert
        if (dismissedAlerts.value[payload.new.id]) return
        
        // Check if we're already showing this alert
        if (notifications.value.some(n => n.id === payload.new.id)) return

        // Check if alert is within 2 hours
        const alertTime = new Date(payload.new.created_at).getTime()
        const twoHoursAgo = new Date().getTime() - (2 * 60 * 60 * 1000)
        if (alertTime < twoHoursAgo) return
        
        // Add to notifications
        notifications.value.push({
          id: payload.new.id,
          title: payload.new.title || 'Alert',
          content: payload.new.content || payload.new.message || 'New alert',
          category: payload.new.category || 'General',
          created_at: payload.new.created_at
        })
      }
    )
    .subscribe()
}

// Set up polling for alerts as fallback
let pollInterval: any = null
// Store event handler for cleanup
let checkAlertsHandler: EventListener | null = null

onMounted(() => {
  console.log('AlertNotificationSystem mounted')
  // Make the notification system globally accessible for debugging
  window.alertSystem = {
    checkForAlerts: checkForNewAlerts,
    addAlert: (alert: { id?: number; title?: string; content?: string; message?: string; category?: string; created_at?: string }) => {
      console.log('Manually adding alert:', alert)
      notifications.value.push({
        id: alert.id || Math.floor(Math.random() * 100000),
        title: alert.title || 'Manual Alert',
        content: alert.content || alert.message || 'Alert content',
        category: alert.category || 'General',
        created_at: alert.created_at || new Date().toISOString()
      })
    },
    getNotifications: () => notifications.value
  }
  
  loadStoredAlertState()
  checkForNewAlerts()
  subscribeToAlerts()
  
  // Poll every 30 seconds as fallback
  pollInterval = setInterval(checkForNewAlerts, 30000)
  
  // Check for expired alerts every minute
  setInterval(() => {
    const twoHoursAgo = new Date().getTime() - (2 * 60 * 60 * 1000)
    notifications.value = notifications.value.filter(alert => {
      const alertTime = new Date(alert.created_at).getTime()
      if (alertTime < twoHoursAgo) {
        console.log('Auto-dismissing alert older than 2 hours:', alert.id)
        dismissedAlerts.value[alert.id] = true
        saveAlertState()
        return false
      }
      return true
    })
  }, 60000) // Check every minute
  
  // Also listen for the custom event for demo alerts
  checkAlertsHandler = (() => {
    console.log('check-alerts event received')
    checkForNewAlerts()
  }) as EventListener
  
  window.addEventListener('check-alerts', checkAlertsHandler)
})

onBeforeUnmount(() => {
  console.log('AlertNotificationSystem unmounting')
  
  if (subscription) {
    supabase.removeChannel(subscription)
  }
  
  if (pollInterval) {
    clearInterval(pollInterval)
  }
  
  // Remove event listener using the stored reference
  if (checkAlertsHandler) {
    window.removeEventListener('check-alerts', checkAlertsHandler)
    checkAlertsHandler = null
  }
})

// Get appropriate color for notification based on category
const getAlertColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'health':
      return 'bg-red-100 border-red-500'
    case 'safety':
      return 'bg-yellow-100 border-yellow-500'
    case 'weather':
      return 'bg-blue-100 border-blue-500'
    case 'emergency':
      return 'bg-red-100 border-red-600'
    default:
      return 'bg-gray-100 border-gray-400'
  }
}
</script>

<template>
  <div class="fixed top-4 right-4 z-50 space-y-2 w-80">
    <transition-group name="alert">
      <div
        v-for="alert in notifications"
        :key="alert.id"
        :class="['notification-alert border-l-4 p-4 rounded shadow-lg', getAlertColor(alert.category)]"
        @click="markAsSeen(alert.id)"
      >
        <h3 class="font-semibold text-gray-800">{{ alert.title }}</h3>
        <p class="text-sm text-gray-700">{{ alert.content }}</p>
        <div class="flex justify-between text-xs text-gray-500 mt-2">
          <span>{{ new Date(alert.created_at).toLocaleTimeString() }}</span>
          <div>
            <span class="cursor-pointer underline mr-2" @click.stop="viewAlertDetails(alert, $event)">Details</span>
            <span class="cursor-pointer underline" @click.stop="dismissAlert(alert.id)">Dismiss</span>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- Alert Details Modal -->
    <div v-if="showDetailsModal && selectedAlert" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
      <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div class="p-6">
          <div class="flex justify-between items-start">
            <h2 class="text-xl font-semibold text-gray-900">{{ selectedAlert.title }}</h2>
            <button @click="closeDetailsModal" class="text-gray-400 hover:text-gray-500">
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div class="mt-4 space-y-4">
            <div class="flex items-center justify-between text-sm text-gray-500">
              <span :class="['px-2 py-1 rounded-full border', getAlertColor(selectedAlert.category)]">
                {{ selectedAlert.category }}
              </span>
              <time>{{ new Date(selectedAlert.created_at).toLocaleString() }}</time>
            </div>
            
            <div class="text-gray-700 whitespace-pre-wrap">{{ selectedAlert.content }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.notification-alert {
  cursor: pointer;
  transition: all 0.3s ease;
}

.notification-alert:hover {
  transform: translateX(-5px);
}

.alert-enter-active,
.alert-leave-active {
  transition: all 0.5s ease;
}

.alert-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.alert-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style> 