<script setup lang="ts">
import { ref, h, render } from 'vue'
import { triggerDemoAlert, sampleAlerts, clearSeenAlerts } from '../services/alertNotificationService'
import SimpleAlert from './SimpleAlert.vue'

// Reactive references for the component
const selectedAlert = ref<number | undefined>(undefined)
const showSuccess = ref(false)

// Emit event to parent
const emit = defineEmits(['switchToAlertLayer'])

// Function to trigger a demo alert
const triggerAlert = () => {
  const alert = triggerDemoAlert(selectedAlert.value)
  
  console.log('Dispatching check-alerts event', alert)
  
  // Try all available methods to trigger the alert
  // 1. Store in sessionStorage and dispatch event
  sessionStorage.setItem('demoAlert', JSON.stringify(alert))
  window.dispatchEvent(new CustomEvent('check-alerts'))
  
  // 2. Try direct access to alert system if available
  if (window.alertSystem) {
    console.log('Using direct access to alertSystem')
    window.alertSystem.addAlert(alert)
  }
  
  // 3. Dispatch update-map-alerts for map display
  window.dispatchEvent(new CustomEvent('update-map-alerts', { 
    detail: { alert }
  }))
  
  // Switch to the "Active Alerts" layer (ID 4) so the alert becomes visible on the map
  emit('switchToAlertLayer')
  
  // Show success message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

// Function specifically to test notifications without map
const testNotificationOnly = () => {
  const alert = triggerDemoAlert(selectedAlert.value)
  
  console.log('TEST: Triggering notification-only alert', alert)
  
  // Method 1: Create a direct DOM element for the alert
  const alertContainer = document.createElement('div')
  document.body.appendChild(alertContainer)
  
  // Create a Vue component instance directly
  const vNode = h(SimpleAlert, {
    title: alert.title || 'Direct Alert',
    message: alert.content || alert.message || 'Alert content',
    category: alert.category || 'info'
  })
  
  // Render the component to the container
  render(vNode, alertContainer)
  
  // Method 2: Also try the standard approach
  sessionStorage.setItem('demoAlert', JSON.stringify(alert))
  window.dispatchEvent(new CustomEvent('check-alerts'))
  
  // Show success message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

// Function to directly show an alert without any framework
const showDirectAlert = () => {
  const alert = triggerDemoAlert(selectedAlert.value)
  
  // Use the browser's built-in alert
  window.alert(`${alert.title}: ${alert.content || alert.message}`);
  
  // Also switch to alert layer on map
  emit('switchToAlertLayer')
  
  // Show success message
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}

// Function to reset demo by clearing seen alerts
const resetDemo = () => {
  clearSeenAlerts()
  showSuccess.value = true
  setTimeout(() => {
    showSuccess.value = false
  }, 3000)
}
</script>

<template>
  <div class="bg-white shadow rounded-lg p-6 mb-8">
    <h2 class="text-xl font-bold text-health-dark mb-4">Alert Notification Demo</h2>
    
    <p class="text-gray-600 mb-4">
      Test the alert notification system by triggering a sample alert. The notification will appear in the top-right corner and on the map.
    </p>
    
    <!-- Alert selection -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Select an alert to trigger:
      </label>
      <select 
        v-model="selectedAlert" 
        class="block w-full rounded-md border-gray-300 shadow-sm focus:border-health-primary focus:ring focus:ring-health-primary/20"
      >
        <option :value="undefined">Random Alert</option>
        <option 
          v-for="alert in sampleAlerts" 
          :key="alert.id" 
          :value="alert.id"
        >
          {{ alert.title }} ({{ alert.category }})
        </option>
      </select>
    </div>
    
    <!-- Action buttons -->
    <div class="flex space-x-4">
      <button 
        @click="triggerAlert" 
        class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
      >
        Trigger Alert
      </button>
      
      <button 
        @click="testNotificationOnly" 
        class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        Test Notification Only
      </button>
      
      <button 
        @click="showDirectAlert" 
        class="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
      >
        Show Direct Alert
      </button>
      
      <button 
        @click="resetDemo" 
        class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
      >
        Reset Seen Alerts
      </button>
    </div>
    
    <!-- Success message -->
    <div 
      v-if="showSuccess" 
      class="mt-4 p-2 bg-green-50 text-green-700 rounded-md text-sm"
    >
      Action completed successfully!
    </div>
  </div>
</template> 