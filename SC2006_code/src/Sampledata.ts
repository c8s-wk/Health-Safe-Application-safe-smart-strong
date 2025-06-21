import supabase from './supabase.ts';
import type { Post } from './services/apiPost'

export async function seedOfficialPosts() {
  const officialUserId1 = 'official_user_1' // must exist in your users table
  const officialUserId2 = 'official_user_2'

  const samplePosts: Omit<Post, 'id' | 'created_at'>[] = [
    {
      content: 'Water Contamination Warning: Residents near Riverbank Ave should not drink tap water until further notice.',
      category_id: 1, // health
      latitude: 1.3521,
      longitude: 103.8198,
      user_id: officialUserId1,
    },
    {
      content: 'Flash Flood Risk: Due to heavy rain, avoid Orchard Road until 6 PM.',
      category_id: 2, // weather
      latitude: 1.3039,
      longitude: 103.8318,
      user_id: officialUserId2,
    }
  ]

  const { data, error } = await supabase
    .from('post')
    .insert(samplePosts)

  if (error) {
    console.error('Error inserting official posts:', error.message)
  } else {
    console.log('Seeded official posts:', data)
  }
}

export async function seedSampleAlerts() {
  try {
    console.log('Attempting to seed sample alerts...')
    
    // Get the current user's session for their UUID
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw new Error('You must be logged in to seed alerts')
    }
    
    // Use the authenticated user's actual UUID
    const userId = session.user.id

    // First, check the actual schema of the alert table
    const { data: schemaData, error: schemaError } = await supabase
      .from('alert')
      .select('*')
      .limit(1)

    if (schemaError) {
      console.error('Error checking alert table schema:', schemaError.message)
    } else {
      const columns = schemaData && schemaData.length > 0 ? Object.keys(schemaData[0]) : []
      console.log('Alert table exists with columns:', columns.join(', '))
    }

    // Create alerts with minimum required fields
    const sampleAlerts = [
      {
        content: 'Water Contamination Warning: Residents near Riverbank Ave should not drink tap water until further notice.',
        user_id: userId // Use the actual UUID
      },
      {
        content: 'Flash Flood Risk: Due to heavy rain, avoid Orchard Road until 6 PM.',
        user_id: userId // Use the actual UUID
      }
    ]

    // Now try to insert the alerts
    console.log('Inserting alerts with user_id (UUID):', userId)
    const { data, error } = await supabase
      .from('alert')
      .insert(sampleAlerts)
      .select()

    if (error) {
      console.error('Error inserting sample alerts:', error.message)
      
      // If direct insert fails, try using function call with proper UUID
      try {
        // Use the seed_alerts_minimal function which expects a UUID
        console.log('Trying with seed_alerts_minimal function...')
        const { data: rpcData, error: rpcError } = await supabase
          .rpc('seed_alerts_minimal', {
            alerts: JSON.stringify(sampleAlerts),
            user_id: userId
          })
          
        if (rpcError) {
          throw rpcError
        }
        
        console.log('Successfully created alerts via RPC function')
        return rpcData
      } catch (rpcError) {
        console.error('RPC function also failed:', (rpcError as Error).message)
        throw error // Throw the original error
      }
    }
    
    console.log('Successfully seeded alerts:', data)
    return data
  } catch (error) {
    console.error('Error seeding sample alerts:', (error as Error).message)
    throw error
  }
}
