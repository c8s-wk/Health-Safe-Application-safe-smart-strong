import supabase from '../supabase'

// Define the Alert interface
export interface Alert {
  id: number
  title?: string
  content?: string
  message?: string
  category?: string
  created_at?: string
  user_id?: string
  latitude?: number
  longitude?: number
  location?: string
  [key: string]: any
}

// Sample alerts for demo purposes
export const sampleAlerts: Alert[] = [
  {
    id: 1001,
    title: 'Critical Health Alert',
    content: 'Water Contamination Warning: Residents near Riverbank Ave should not drink tap water until further notice.',
    category: 'health',
    created_at: new Date().toISOString(),
    user_id: 'official_user_1',
    latitude: 1.3329,
    longitude: 103.7436,
    location: 'Riverbank Avenue'
  },
  {
    id: 1002,
    title: 'Weather Warning',
    content: 'Flash Flood Risk: Due to heavy rain, avoid Orchard Road until 6 PM.',
    category: 'weather',
    created_at: new Date().toISOString(),
    user_id: 'official_user_2',
    latitude: 1.3037,
    longitude: 103.8332,
    location: 'Orchard Road'
  },
  {
    id: 1003,
    title: 'Safety Notification',
    content: 'Road Closure: Construction work on Stevens Road will cause delays. Please use alternative routes.',
    category: 'safety',
    created_at: new Date().toISOString(),
    user_id: 'official_user_1',
    latitude: 1.3157,
    longitude: 103.8262,
    location: 'Stevens Road'
  }
]

// Function for demo purposes to trigger a specific alert
export function triggerDemoAlert(alertId?: number): Alert {
  // Get a specific alert or random one if no ID provided
  const alert = alertId 
    ? sampleAlerts.find(a => a.id === alertId) 
    : sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)]
  
  // If alert not found (shouldn't happen), use the first sample
  const selectedAlert = alert || sampleAlerts[0]
  
  // Make sure alert has coordinates for map display
  // Singapore coordinates if none provided
  if (!selectedAlert.latitude) selectedAlert.latitude = 1.3521
  if (!selectedAlert.longitude) selectedAlert.longitude = 103.8198
  
  // Add current timestamp
  selectedAlert.created_at = new Date().toISOString()
  
  console.log('Triggering alert for map display:', selectedAlert)
  
  // Make a copy to ensure we don't modify the original
  const alertCopy = { ...selectedAlert }
  
  // Ensure data type consistency for coordinates
  alertCopy.latitude = parseFloat(String(alertCopy.latitude))
  alertCopy.longitude = parseFloat(String(alertCopy.longitude))
  
  // Also dispatch an event to update the map immediately
  window.dispatchEvent(new CustomEvent('update-map-alerts', {
    detail: { alert: alertCopy }
  }))
  
  return alertCopy
}

// Function to get the latest alerts from official users
export async function getLatestAlerts(limit = 20): Promise<Alert[]> {
  try {
    // First try to get real alerts from database
    const { data, error } = await supabase
      .from('alert')
      .select('*')
      .or('user_id.eq.official_user_1,user_id.eq.official_user_2')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.warn('Error fetching alerts from database, using sample data:', error.message)
      return sampleAlerts.slice(0, limit)
    }

    // If we got real data, use it
    if (data && data.length > 0) {
      return data
    }
    
    // Otherwise use sample data
    console.log('No alerts found in database, using sample data')
    return sampleAlerts.slice(0, limit)
  } catch (error) {
    console.error('Error in getLatestAlerts:', error)
    // Fallback to sample data
    return sampleAlerts.slice(0, limit)
  }
}

// Store seen alert IDs in localStorage
export function markAlertAsSeen(alertId: number): void {
  try {
    // Get existing seen alerts
    const seenAlerts = getSeenAlerts()
    
    // Add current alert if not already seen
    if (!seenAlerts.includes(alertId)) {
      seenAlerts.push(alertId)
      
      // Save back to localStorage
      localStorage.setItem('seenAlerts', JSON.stringify(seenAlerts))
    }
  } catch (error) {
    console.error('Error marking alert as seen:', error)
  }
}

// Get array of seen alert IDs from localStorage
export function getSeenAlerts(): number[] {
  try {
    const seenAlertsStr = localStorage.getItem('seenAlerts')
    return seenAlertsStr ? JSON.parse(seenAlertsStr) : []
  } catch (error) {
    console.error('Error getting seen alerts:', error)
    return []
  }
}

// Clear all seen alerts (for demo purposes)
export function clearSeenAlerts(): void {
  localStorage.removeItem('seenAlerts')
}

// Check if there are new unseen alerts
export async function checkForNewAlerts(): Promise<Alert | null> {
  try {
    const latestAlerts = await getLatestAlerts(1)
    if (latestAlerts.length === 0) {
      return null
    }

    const latestAlert = latestAlerts[0]
    const seenAlerts = getSeenAlerts()

    // If the latest alert hasn't been seen yet, return it
    if (!seenAlerts.includes(latestAlert.id)) {
      return latestAlert
    }

    return null
  } catch (error) {
    console.error('Error checking for new alerts:', error)
    return null
  }
} 