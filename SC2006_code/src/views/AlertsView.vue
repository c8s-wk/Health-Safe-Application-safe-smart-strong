<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import supabase from '../supabase'
import { createAlert } from '../services/apiAlert'
import { seedSampleAlerts as seedAlertsFromService, getActiveAlerts, isAlertExpired, type Alert } from '../services/sampleAlertService'
import AlertNotification from '../components/AlertNotification.vue'
import AlertHistory from '../components/AlertHistory.vue'
import { Category,getCategoryById } from '../services/apiCategory'

// Fix type error with a more complete GenericAlert interface
interface GenericAlert {
  id: number;
  created_at: string;
  expires_at?: string;
  [key: string]: any; // Allow any other properties
}

const alerts = ref<GenericAlert[]>([])
const allAlerts = ref<GenericAlert[]>([]) // Store all alerts
const activeFilter = ref<'current' | 'past' | 'all'>('current')
const loading = ref(false)
const errorMessage = ref('')
const seedingMessage = ref('')
const debugInfo = ref('')
const tableColumns = ref<string[]>([])
const error = ref<string | null>(null);
const isAdmin = ref(false);

// Use router for navigation
const router = useRouter()

// Define filter options
const filters = [
  { label: 'Current Alerts', value: 'current' as const },
  { label: 'Past Alerts', value: 'past' as const },
  { label: 'All Alerts', value: 'all' as const }
];

const filterAlerts = async () => {
  if (activeFilter.value === 'current') {
    alerts.value = allAlerts.value.filter(alert => !isAlertExpired(alert as Alert))
  } else if (activeFilter.value === 'past') {
    alerts.value = allAlerts.value.filter(alert => isAlertExpired(alert as Alert))
  } else {
    alerts.value = [...allAlerts.value]
  }

  for (let alert of alerts.value) {
    alert.category=(await getCategoryById(alert.category_id)).name;
  }
  return alerts.value;
}

// Computed filtered alerts
const filteredAlerts = computed(() => filterAlerts());

const checkTableSchema = async () => {
  try {
    debugInfo.value = 'Checking alert table schema...'
    
    // First, let's try to get a single row to see what columns exist
    const { data, error } = await supabase
      .from('alert')
      .select('*')
      .limit(1)
    
    if (error) {
      if (error.message.includes('relation "alert" does not exist')) {
        debugInfo.value = 'Alert table does not exist. Creating it...'
        // We can't create tables directly from the client, so we'll show a message
        errorMessage.value = 'The alert table does not exist in your database. Please create it first.'
        return false
      }
      debugInfo.value = `Error checking table: ${error.message}`
      throw error
    }
    
    if (data && data.length > 0) {
      tableColumns.value = Object.keys(data[0])
      debugInfo.value = `Alert table exists with columns: ${tableColumns.value.join(', ')}`
    } else {
      debugInfo.value = 'Alert table exists but is empty'
    }
    
    return true
  } catch (error) {
    debugInfo.value = `Error checking table: ${(error as Error).message}`
    errorMessage.value = 'Failed to check if alert table exists: ' + (error as Error).message
    return false
  }
}

const loadAlerts = async () => {
  try {
    loading.value = true
    debugInfo.value = 'Attempting to load alerts...'
    
    // Get all alerts from database
    const { data, error } = await supabase
      .from('alert')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching alerts:', error)
      
      // Use the getActiveAlerts function as fallback
      const activeAlerts = await getActiveAlerts()
      allAlerts.value = activeAlerts
      filterAlerts()
      debugInfo.value = `Loaded ${activeAlerts.length} alerts from sample data`
      return
    }
    
    // Store all alerts
    allAlerts.value = data || []
    filterAlerts()
    debugInfo.value = `Loaded ${allAlerts.value.length} alerts from database`
  } catch (error) {
    errorMessage.value = 'Failed to load alerts: ' + (error as Error).message
  } finally {
    loading.value = false
  }
}

const setFilter = (filter: 'current' | 'past' | 'all') => {
  activeFilter.value = filter
  filterAlerts()
}

const getCategoryId = (category: string): number => {
  // Map category strings to numeric IDs based on your schema
  switch(category?.toLowerCase()) {
    case 'health': return 1;
    case 'weather': return 2;
    case 'safety': return 3;
    default: return 1; // Default category ID
  }
}

const seedSampleAlerts = async () => {
  try {
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      errorMessage.value = 'You must be logged in to seed alerts'
      return
    }

    // Try using our new sample alert service
    loading.value = true
    
    // Create sample alerts with more detailed information
    const sampleAlerts = [
      {
        title: 'Water Contamination Alert',
        content: 'Residents near Riverbank Ave should not drink tap water until further notice. Water quality tests have detected elevated levels of contaminants. Boil water before use or use bottled water.',
        category: 'Health',
        location: 'Riverbank Avenue',
        latitude: 1.3329,
        longitude: 103.7436,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3 hours from now
      },
      {
        title: 'Flooding Alert',
        content: 'Due to heavy rain, avoid Orchard Road until 6 PM. Flash floods have been reported in the area. Emergency services are on standby.',
        category: 'Weather',
        location: 'Orchard Road',
        latitude: 1.3037,
        longitude: 103.8332,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
      },
      {
        title: 'Road Closure Notice',
        content: 'Maintenance work on the Central Expressway will cause lane closures from 10 PM to 5 AM. Expect delays and plan alternative routes.',
        category: 'Safety',
        location: 'Central Expressway',
        latitude: 1.3521,
        longitude: 103.8198,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
      }
    ]
    
    // Try to insert the alerts directly
    const { data, error } = await supabase
      .from('alert')
      .insert(sampleAlerts)
      .select()
    
    if (error) {
      console.error('Error inserting alerts directly:', error)
      
      // If direct insert fails, try using the API service
      try {
        for (const alert of sampleAlerts) {
          await createAlert({
            content: alert.content,
            category_id: getCategoryId(alert.category), 
            longitude: alert.longitude,
            latitude: alert.latitude
          })
        }
        
        seedingMessage.value = 'Sample alerts seeded successfully via API'
        loadAlerts()
        return
      } catch (apiError) {
        console.error('Error seeding alerts via API:', apiError)
        
        // If API fails, try using RPC
        try {
          const { error: rpcError } = await supabase.rpc('seed_alerts')
          
          if (rpcError) {
            throw rpcError
          }
          
          seedingMessage.value = 'Sample alerts seeded successfully via RPC'
          loadAlerts()
          return
        } catch (error: unknown) {
          const errorObj = error as Error;
          console.error('Error seeding alerts via RPC:', errorObj.message || String(error));
          errorMessage.value = `Error seeding alerts: ${errorObj.message || String(error)}`;
        }
      }
    } else {
      seedingMessage.value = 'Sample alerts seeded successfully'
      loadAlerts()
    }
  } catch (error) {
    console.error('Error in seedSampleAlerts:', error)
    errorMessage.value = `Error seeding alerts: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    loading.value = false
  }
}

const formatDateTime = (timestamp: string) =>
  new Date(timestamp).toLocaleString()

const getAlertColor = (category: string) => {
  switch (category?.toLowerCase()) {
    case 'health':
      return 'border-red-500'
    case 'safety':
      return 'border-yellow-500'
    case 'weather':
      return 'border-blue-500'
    case 'emergency':
      return 'border-red-600'
    default:
      return 'border-gray-400'
  }
}

const getTimeRemaining = (expiresAt: string) => {
  const now = new Date()
  const expires = new Date(expiresAt)
  const diffMs = expires.getTime() - now.getTime()
  
  if (diffMs <= 0) return 'Expired'
  
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  return `${hours}h ${minutes}m remaining`
}

// Navigate to alert details
const viewAlertDetails = (alertId: number) => {
  router.push(`/alerts/details?id=${alertId}`)
}

// Function to acknowledge an alert
const acknowledgeAlert = (alertId: number) => {
  // Find the alert in the list
  const alert = allAlerts.value.find(a => a.id === alertId);
  if (alert) {
    // Update the alert status
    alert.acknowledged = true;
    // TODO: Update in the database
    console.log(`Alert ${alertId} acknowledged`);
  }
};

// Check if user is admin
onMounted(async () => {
  const tableExists = await checkTableSchema()
  if (tableExists) {
    // Load existing alerts
    await loadAlerts()
  }
  
  // Check if user is admin (example implementation)
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    
    isAdmin.value = profile?.role === 'admin'
  }
})
</script>

<template>
  <div class="alerts-container">
    <h1 class="page-title">Alerts</h1>
    <div v-if="errorMessage" class="alert-error">
      {{ errorMessage }}
    </div>
    <div v-else>
      <!-- Alert Management Section -->
      <div class="section">
        <h2 class="section-title">Alert Management</h2>
        <div class="filter-controls">
          <button 
            v-for="filter in filters" 
            :key="filter.value" 
            :class="['filter-button', { active: activeFilter === filter.value }]" 
            @click="setFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
        
        <div v-if="loading" class="loading">
          Loading alerts...
        </div>
        <div v-else-if="alerts.length === 0" class="no-alerts">
          No alerts found for the selected filter.
        </div>
        <div v-else class="alerts-grid">
          <!-- For demo purposes, showing alert cards -->
          <div 
            v-for="alert in alerts" 
            :key="alert.id" 
            class="alert-card"
            @click="viewAlertDetails(alert.id)"
          >
            <h3 class="alert-title">{{ alert.title || ('Alert '+ (alert.category||'')) }}</h3>
            <p class="alert-content">{{ alert.content || alert.message || 'No content' }}</p>
            <div class="alert-footer">
              <span class="alert-category" :class="getAlertColor(alert.category)">
                {{ alert.category || 'Uncategorized' }}
              </span>
              <span class="alert-time">{{ formatDateTime(alert.created_at) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Alert History Section -->
      <div class="section">
        <h2 class="section-title">Alert History</h2>
        <AlertHistory />
      </div>
      
      <!-- Admin Controls - only show if user is admin -->
      <div v-if="isAdmin" class="section admin-section">
        <h2 class="section-title">Admin Controls</h2>
        <div class="admin-controls">
          <button @click="seedSampleAlerts" class="admin-button">
            Seed Sample Alerts
          </button>
          <button @click="checkTableSchema" class="admin-button">
            Check Table Schema
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.page-title {
  font-size: 2rem;
  margin-bottom: 20px;
  color: #333;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.section {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 20px;
  margin-bottom: 30px;
}

.section-title {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #333;
  border-bottom: 1px solid #eee;
  padding-bottom: 10px;
}

.filter-controls {
  margin-bottom: 20px;
}

.filter-button {
  padding: 8px 16px;
  margin-right: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
  cursor: pointer;
}

.active {
  background-color: #007bff;
  color: white;
}

.loading {
  text-align: center;
  margin-bottom: 20px;
}

.no-alerts {
  text-align: center;
  margin-bottom: 20px;
}

.alerts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.alert-card {
  border-left: 4px solid #ddd;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.alert-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
}

.alert-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 8px;
}

.alert-content {
  font-size: 0.9rem;
  color: #555;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.alert-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.alert-category {
  padding: 2px 8px;
  border-radius: 12px;
  background-color: #f0f0f0;
}

.border-red-500 {
  border-left-color: #f56565;
  background-color: #fff5f5;
}

.border-yellow-500 {
  border-left-color: #ecc94b;
  background-color: #fffff0;
}

.border-blue-500 {
  border-left-color: #4299e1;
  background-color: #ebf8ff;
}

.border-red-600 {
  border-left-color: #e53e3e;
  background-color: #fff5f5;
}

.admin-section {
  margin-top: 30px;
}

.admin-controls {
  display: flex;
  gap: 10px;
}

.admin-button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  background-color: #007bff;
  color: white;
  cursor: pointer;
}

.admin-button:hover {
  background-color: #0069d9;
}
</style>

