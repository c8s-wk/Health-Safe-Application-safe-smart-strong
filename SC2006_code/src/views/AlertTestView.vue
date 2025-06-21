<script setup lang="ts">
import { ref } from 'vue'
import { seedSampleAlerts } from '../services/sampleAlertService'

const loading = ref(false)
const message = ref('')

// Function to trigger immediate notification of a sample alert
const triggerAlert = async () => {
  try {
    loading.value = true
    message.value = ''
    
    await seedSampleAlerts()
    
    message.value = 'Alert notification triggered! Check the top-right corner.'
  } catch (error) {
    console.error('Error triggering alert:', error)
    message.value = 'Error triggering alert: ' + (error instanceof Error ? error.message : String(error))
  } finally {
    loading.value = false
  }
}

// Function to reset seen alerts in localStorage
const resetSeenAlerts = () => {
  localStorage.removeItem('seenAlerts')
  message.value = 'Alert notification history cleared. New alerts will appear again.'
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <div class="bg-white shadow rounded-lg p-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-4">Alert Notification Demo</h2>
      
      <p class="text-gray-600 mb-6">
        Test the alert notification system by triggering a sample alert. The notification will appear in the top-right corner.
      </p>
      
      <div class="space-y-4">
        <div class="flex space-x-4">
          <button
            @click="triggerAlert"
            :disabled="loading"
            class="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {{ loading ? 'Triggering...' : 'Trigger Alert Notification' }}
          </button>
          
          <button
            @click="resetSeenAlerts"
            class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
          >
            Reset Seen Alerts
          </button>
        </div>
        
        <div v-if="message" class="p-4 bg-blue-50 text-blue-700 rounded-md">
          {{ message }}
        </div>

        <div class="bg-gray-50 p-4 rounded-md border border-gray-200 mt-8">
          <h3 class="font-medium text-lg mb-2">How it works:</h3>
          <ul class="list-disc pl-5 space-y-1">
            <li>The notification system shows alerts in real-time</li>
            <li>Alerts appear in the top-right corner of the screen</li>
            <li>Clicking an alert or its "Dismiss" button will mark it as seen</li>
            <li>Seen alerts won't appear again (unless you reset them)</li>
            <li>In a real app, these alerts would come from official sources</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template> 