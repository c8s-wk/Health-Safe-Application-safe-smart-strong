import supabase from '../supabase'

// Define the Alert interface
export interface Alert {
  id: number
  title?: string
  content?: string
  message?: string
  category?: string
  location?: string
  latitude?: number
  longitude?: number
  created_at: string
  expires_at?: string
  user_id?: string
}

// Sample alerts with 3-hour expiration
export const sampleAlerts: Omit<Alert, 'id'>[] = [
  {
    title: 'Water Contamination Alert',
    content: 'Residents near Riverbank Ave should not drink tap water until further notice.',
    category: 'Emergency',
    location: 'Riverbank Avenue',
    latitude: 1.3329,
    longitude: 103.7436,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    user_id: 'official_user_1'
  },
  {
    title: 'Flooding Alert',
    content: 'Due to heavy rain, avoid Orchard Road until 6 PM.',
    category: 'Weather',
    location: 'Orchard Road',
    latitude: 1.3037,
    longitude: 103.8332,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    user_id: 'official_user_2'
  },
  {
    title: 'Dengue Cluster Alert',
    content: 'New dengue cluster detected in Toa Payoh. Residents advised to take precautions.',
    category: 'Health',
    location: 'Toa Payoh',
    latitude: 1.3329,
    longitude: 103.8497,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    user_id: 'official_user_1'
  },
  {
    title: 'Road Closure Alert',
    content: 'Stevens Road closed for emergency repairs. Please use alternative routes.',
    category: 'Safety',
    location: 'Stevens Road',
    latitude: 1.3157,
    longitude: 103.8262,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(), // 3 hours from now
    user_id: 'official_user_2'
  }
]

/**
 * Checks if an alert has expired
 */
export function isAlertExpired(alert: Alert): boolean {
  if (!alert.expires_at) return false
  
  const now = new Date()
  const expiresAt = new Date(alert.expires_at)
  return now > expiresAt
}

/**
 * Gets all active alerts (not expired)
 */
export async function getActiveAlerts(): Promise<Alert[]> {
  try {
    // Try to get alerts from the database
    const { data, error } = await supabase
      .from('alert')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error fetching alerts:', error)
      // If database call fails, return sample alerts for demo purposes
      return getSampleAlerts()
    }
    
    // Filter out expired alerts
    const activeAlerts = data
      ? data.filter(alert => !isAlertExpired(alert))
      : []
    
    // If no active alerts in database, return sample alerts for demo
    return activeAlerts.length > 0 ? activeAlerts : getSampleAlerts()
  } catch (error) {
    console.error('Error in getActiveAlerts:', error)
    return getSampleAlerts()
  }
}

// Generate sample alerts for demo purposes
function getSampleAlerts(): Alert[] {
  const now = new Date()
  const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  
  // Sample alerts with different timestamps and 3-hour expiration times
  return [
    {
      id: 1001,
      title: 'Water Contamination Alert',
      content: 'Residents near Riverbank Ave should not drink tap water until further notice. Water quality tests have detected elevated levels of contaminants.',
      category: 'Health',
      location: 'Riverbank Avenue',
      latitude: 1.3329,
      longitude: 103.7436,
      created_at: new Date(now.getTime() - 20 * 60000).toISOString(), // 20 minutes ago
      expires_at: threeHoursFromNow.toISOString() // 3 hours from now
    },
    {
      id: 1002,
      title: 'Flooding Alert',
      content: 'Due to heavy rain, avoid Orchard Road until 6 PM. Flash floods have been reported in the area.',
      category: 'Weather',
      location: 'Orchard Road',
      latitude: 1.3037,
      longitude: 103.8332,
      created_at: new Date(now.getTime() - 45 * 60000).toISOString(), // 45 minutes ago
      expires_at: threeHoursFromNow.toISOString() // 3 hours from now
    },
    {
      id: 1003,
      title: 'Road Closure Notice',
      content: 'Maintenance work on the Central Expressway will cause lane closures from 10 PM to 5 AM. Expect delays.',
      category: 'Safety',
      location: 'Central Expressway',
      latitude: 1.3521,
      longitude: 103.8198,
      created_at: new Date(now.getTime() - 120 * 60000).toISOString(), // 2 hours ago
      expires_at: threeHoursFromNow.toISOString() // 3 hours from now
    }
  ]
}

/**
 * Seeds sample alerts when needed
 */
export async function seedSampleAlerts(): Promise<void> {
  try {
    // Generate sample alerts with current timestamps
    const alertsToInsert = getSampleAlerts().map(alert => ({
      ...alert,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString() // 3 hours from now
    }))
    
    // Try to insert them into the database
    const { error } = await supabase
      .from('alert')
      .insert(alertsToInsert)
    
    if (error) {
      console.warn('Could not insert alerts into database:', error.message)
      console.log('Falling back to client-side alert simulation')
    } else {
      console.log('Successfully inserted sample alerts into database')
    }
    
    // Trigger custom event to check for alerts immediately
    window.dispatchEvent(new CustomEvent('check-alerts'))
    
    console.log('Sample alerts seeded successfully')
  } catch (error) {
    console.error('Error seeding sample alerts:', error)
    // Even if there's an error, we still trigger the event to use the fallback alerts
    window.dispatchEvent(new CustomEvent('check-alerts'))
  }
} 